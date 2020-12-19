/**
 * @packageDocumentation
 * @module API-EVM
 */

import { Buffer } from 'buffer/';
import BN from 'bn.js';
import AvalancheCore from '../../avalanche';
import { JRPCAPI } from '../../common/jrpcapi';
import { RequestResponseData } from '../../common/apibase';
import BinTools from '../../utils/bintools';
import { 
  UTXOSet,
  UTXO 
} from './utxos';
import { KeyChain } from './keychain';
import { 
  Defaults, 
  PrimaryAssetAlias 
} from '../../utils/constants';
import { Tx, UnsignedTx } from './tx';
import { EVMConstants } from './constants';
import { 
  Asset,
  Index, 
  UTXOResponse 
} from './../../common/interfaces'
import { EVMInput } from './inputs';
import { 
  SECPTransferOutput, 
  TransferableOutput 
} from './outputs';
import { ExportTx } from './exporttx';

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance();

/**
 * Class for interacting with a node's EVMAPI 
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
export class EVMAPI extends JRPCAPI {
  /**
   * @ignore
   */
  protected keychain: KeyChain = new KeyChain('', '');

  protected blockchainID: string = '';

  protected blockchainAlias: string = undefined;

  protected AVAXAssetID:Buffer = undefined;

  protected txFee:BN = undefined;

  /**
   * Gets the alias for the blockchainID if it exists, otherwise returns `undefined`.
   *
   * @returns The alias for the blockchainID
   */
  getBlockchainAlias = (): string => {
    if(typeof this.blockchainAlias === "undefined"){
      const netID: number = this.core.getNetworkID();
      if (netID in Defaults.network && this.blockchainID in Defaults.network[netID]) {
        this.blockchainAlias = Defaults.network[netID][this.blockchainID].alias;
        return this.blockchainAlias;
      } else {
        /* istanbul ignore next */
        return undefined;
      }
    } 
    return this.blockchainAlias;
  };

  /**
   * Sets the alias for the blockchainID.
   * 
   * @param alias The alias for the blockchainID.
   * 
   */
  setBlockchainAlias = (alias: string): string => {
    this.blockchainAlias = alias;
    /* istanbul ignore next */
    return undefined;
  };


  /**
   * Gets the blockchainID and returns it.
   *
   * @returns The blockchainID
   */
  getBlockchainID = (): string => this.blockchainID;

  /**
   * Refresh blockchainID, and if a blockchainID is passed in, use that.
   *
   * @param Optional. BlockchainID to assign, if none, uses the default based on networkID.
   *
   * @returns A boolean if the blockchainID was successfully refreshed.
   */
  refreshBlockchainID = (blockchainID: string = undefined): boolean => {
    const netID: number = this.core.getNetworkID();
    if (typeof blockchainID === 'undefined' && typeof Defaults.network[netID] !== "undefined") {
      this.blockchainID = Defaults.network[netID].C.blockchainID; //default to C-Chain
      return true;
    } 
    
    if (typeof blockchainID === 'string') {
      this.blockchainID = blockchainID;
      return true;
    }

    return false;
  };

  /**
   * Takes an address string and returns its {@link https://github.com/feross/buffer|Buffer} representation if valid.
   *
   * @returns A {@link https://github.com/feross/buffer|Buffer} for the address if valid, undefined if not valid.
   */
  parseAddress = (addr: string): Buffer => {
    const alias: string = this.getBlockchainAlias();
    const blockchainID: string = this.getBlockchainID();
    return bintools.parseAddress(addr, blockchainID, alias, EVMConstants.ADDRESSLENGTH);
  };

  addressFromBuffer = (address: Buffer): string => {
    const chainID: string = this.getBlockchainAlias() ? this.getBlockchainAlias() : this.getBlockchainID();
    return bintools.addressToString(this.core.getHRP(), chainID, address);
  };

  /**
     * Retrieves an assets name and symbol.
     *
     * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an b58 serialized string for the AssetID or its alias.
     *
     * @returns Returns a Promise<Asset> with keys "name", "symbol", "assetID" and "denomination".
     */
  getAssetDescription = async (assetID: Buffer | string): Promise<any> => {
    let asset: string;
    if (typeof assetID !== 'string') {
      asset = bintools.cb58Encode(assetID);
    } else {
      asset = assetID;
    }

    const params: {
      assetID: Buffer | string
    } = {
      assetID: asset,
    };

    const tmpBaseURL: string = this.getBaseURL();

    // set base url to get asset description
    this.setBaseURL("/ext/bc/X");
    const response: RequestResponseData = await this.callMethod('avm.getAssetDescription', params);

    // set base url back what it originally was
    this.setBaseURL(tmpBaseURL);
    return {
      name: response.data.result.name,
      symbol: response.data.result.symbol,
      assetID: bintools.cb58Decode(response.data.result.assetID),
      denomination: parseInt(response.data.result.denomination, 10),
    }
  };
  
  /**
   * Fetches the AVAX AssetID and returns it in a Promise.
   *
   * @param refresh This function caches the response. Refresh = true will bust the cache.
   * 
   * @returns The the provided string representing the AVAX AssetID
   */
  getAVAXAssetID = async (refresh: boolean = false): Promise<Buffer> => {
    if (typeof this.AVAXAssetID === 'undefined' || refresh) {
      const asset: Asset = await this.getAssetDescription(PrimaryAssetAlias);
      this.AVAXAssetID = asset.assetID;
    }
    return this.AVAXAssetID;
  };
  
  /**
   * Overrides the defaults and sets the cache to a specific AVAX AssetID
   * 
   * @param avaxAssetID A cb58 string or Buffer representing the AVAX AssetID
   * 
   * @returns The the provided string representing the AVAX AssetID
   */
  setAVAXAssetID = (avaxAssetID: string | Buffer) => {
    if(typeof avaxAssetID === "string") {
      avaxAssetID = bintools.cb58Decode(avaxAssetID);
    }
    this.AVAXAssetID = avaxAssetID;
  }

  /**
   * Gets the default tx fee for this chain.
   *
   * @returns The default tx fee as a {@link https://github.com/indutny/bn.js/|BN}
   */
  getDefaultTxFee = (): BN => {
    return this.core.getNetworkID() in Defaults.network ? new BN(Defaults.network[this.core.getNetworkID()]["C"]["txFee"]) : new BN(0);
  }

  /**
   * Gets the tx fee for this chain.
   *
   * @returns The tx fee as a {@link https://github.com/indutny/bn.js/|BN}
   */
  getTxFee = (): BN => {
    if(typeof this.txFee === "undefined") {
      this.txFee = this.getDefaultTxFee();
    }
    return this.txFee;
  }

  /**
   * Send ANT (Avalanche Native Token) assets including AVAX from the C-Chain to an account on the X-Chain.
    *
    * After calling this method, you must call the X-Chain’s import method to complete the transfer.
    *
    * @param username The Keystore user that controls the X-Chain account specified in `to`
    * @param password The password of the Keystore user
    * @param to The account on the X-Chain to send the AVAX to. 
    * @param amount Amount of asset to export as a {@link https://github.com/indutny/bn.js/|BN}
    * @param assetID The asset id which is being sent
    *
    * @returns String representing the transaction id
    */
  export = async (
    username: string, 
    password: string, 
    to: string, 
    amount: BN, 
    assetID: string
  ):Promise<string> => {
    const params: {
      username: string, 
      password: string, 
      to: string, 
      amount: string, 
      assetID: string
    } = {
      to,
      amount: amount.toString(10),
      username,
      password,
      assetID
    };
    return this.callMethod('avax.export', params).then((response: RequestResponseData) => response.data.result.txID);
  };

  /**
   * Send AVAX from the C-Chain to an account on the X-Chain.
    *
    * After calling this method, you must call the X-Chain’s importAVAX method to complete the transfer.
    *
    * @param username The Keystore user that controls the X-Chain account specified in `to`
    * @param password The password of the Keystore user
    * @param to The account on the X-Chain to send the AVAX to.
    * @param amount Amount of AVAX to export as a {@link https://github.com/indutny/bn.js/|BN}
    *
    * @returns String representing the transaction id
    */
  exportAVAX = async (
    username: string, 
    password: string, 
    to: string, 
    amount: BN
  ): Promise<string> => {
    const params: {
      username: string, 
      password: string, 
      to: string, 
      amount: string
    } = {
      to,
      amount: amount.toString(10),
      username,
      password,
    };
    return this.callMethod('avax.exportAVAX', params).then((response: RequestResponseData) => response.data.result.txID);
  };

  /**
   * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
   *
   * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
   * @param sourceChain A string for the chain to look for the UTXO's. Default is to use this chain, but if exported UTXOs exist 
   * from other chains, this can used to pull them instead.
   * @param limit Optional. Returns at most [limit] addresses. If [limit] == 0 or > [maxUTXOsToFetch], fetches up to [maxUTXOsToFetch].
   * @param startIndex Optional. [StartIndex] defines where to start fetching UTXOs (for pagination.)
   * UTXOs fetched are from addresses equal to or greater than [StartIndex.Address]
   * For address [StartIndex.Address], only UTXOs with IDs greater than [StartIndex.Utxo] will be returned.
   */
  getUTXOs = async (
    addresses: string[] | string,
    sourceChain: string = undefined,
    limit: number = 0,
    startIndex: Index = undefined
  ): Promise<{
    numFetched:number,
    utxos,
    endIndex: Index
  }> => {
    if(typeof addresses === "string") {
      addresses = [addresses];
    }

    const params: any = {
      addresses: addresses,
      limit
    };
    if(typeof startIndex !== "undefined" && startIndex) {
      params.startIndex = startIndex;
    }

    if(typeof sourceChain !== "undefined") {
      params.sourceChain = sourceChain;
    }

    return this.callMethod('avax.getUTXOs', params).then((response: RequestResponseData) => {
      const utxos: UTXOSet = new UTXOSet();
      let data: any = response.data.result.utxos;
      utxos.addArray(data, false);
      response.data.result.utxos = utxos;
      return response.data.result;
    });
  }

  /**
   * Send ANT (Avalanche Native Token) assets including AVAX from an account on the X-Chain to an address on the C-Chain. This transaction
   * must be signed with the key of the account that the asset is sent from and which pays
   * the transaction fee.
   *
   * @param username The Keystore user that controls the account specified in `to`
   * @param password The password of the Keystore user
   * @param to The address of the account the asset is sent to. 
   * @param sourceChain The chainID where the funds are coming from. Ex: "X"
   *
   * @returns Promise for a string for the transaction, which should be sent to the network
   * by calling issueTx.
   */
  import = async (
    username: string, 
    password: string, 
    to: string, 
    sourceChain: string
  )
  : Promise<string> => {
    const params: {
      username: string, 
      password: string, 
      to: string, 
      sourceChain: string
    } = {
      to,
      sourceChain,
      username,
      password,
    };
    return this.callMethod('avax.import', params)
      .then((response: RequestResponseData) => response.data.result.txID);
  };

  /**
   * Send AVAX from an account on the X-Chain to an address on the C-Chain. This transaction
   * must be signed with the key of the account that the AVAX is sent from and which pays
   * the transaction fee.
   *
   * @param username The Keystore user that controls the account specified in `to`
   * @param password The password of the Keystore user
   * @param to The address of the account the AVAX is sent to. This must be the same as the to
   * argument in the corresponding call to the X-Chain’s exportAVAX
   * @param sourceChain The chainID where the funds are coming from.
   *
   * @returns Promise for a string for the transaction, which should be sent to the network
   * by calling issueTx.
   */
  importAVAX = async (
    username: string, 
    password: string, 
    to: string, 
    sourceChain: string) : 
  Promise<string> => {
    const params: {
      username: string, 
      password: string, 
      to: string, 
      sourceChain: string
    } = {
      to,
      sourceChain,
      username,
      password,
    };
    return this.callMethod('avax.importAVAX', params)
      .then((response: RequestResponseData) => response.data.result.txID);
  };

  /**
   * Give a user control over an address by providing the private key that controls the address.
   *
   * @param username The name of the user to store the private key
   * @param password The password that unlocks the user
   * @param privateKey A string representing the private key in the vm's format
   *
   * @returns The address for the imported private key.
   */
  importKey = async (
    username: string, 
    password: string, 
    privateKey: string
  ): Promise<string> => {
    const params: {
      username: string, 
      password: string, 
      privateKey: string
    } = {
      username,
      password,
      privateKey,
    };
    return this.callMethod('avax.importKey', params).then((response: RequestResponseData) => response.data.result.address);
  };

  /**
   * Calls the node's issueTx method from the API and returns the resulting transaction ID as a string.
   *
   * @param tx A string, {@link https://github.com/feross/buffer|Buffer}, or [[Tx]] representing a transaction
   *
   * @returns A Promise<string> representing the transaction ID of the posted transaction.
   */
  issueTx = async (tx: string | Buffer | Tx): Promise<string> => {
    let Transaction: string = '';
    if (typeof tx === 'string') {
      Transaction = tx;
    } else if (tx instanceof Buffer) {
      const txobj:Tx = new Tx();
      txobj.fromBuffer(tx);
      Transaction = txobj.toString();
    } else if (tx instanceof Tx) {
      Transaction = tx.toString();
    } else {
      /* istanbul ignore next */
      throw new Error('Error - avax.issueTx: provided tx is not expected type of string, Buffer, or Tx');
    }
    const params: {
      tx: string
    } = {
      tx: Transaction.toString(),
    };
    return this.callMethod('avax.issueTx', params).then((response: RequestResponseData) => response.data.result.txID);
  };

  /**
   * Exports the private key for an address.
   *
   * @param username The name of the user with the private key
   * @param password The password used to decrypt the private key
   * @param address The address whose private key should be exported
   *
   * @returns Promise with the decrypted private key as store in the database
   */
  exportKey = async (
    username: string, 
    password: string, 
    address: string
  ): Promise<string> => {
    const params: {
      username: string, 
      password: string, 
      address: string
    } = {
      username,
      password,
      address,
    };
    return this.callMethod('avax.exportKey', params).then((response: RequestResponseData) => response.data.result.privateKey);
  };

  /**
   * Helper function which creates an unsigned Import Tx. For more granular control, you may create your own
   * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param toAddress The address to send the funds
   * @param ownerAddresses The addresses being used to import
   * @param sourceChain The chainid for where the import is coming from
   * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
   *
   * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[ImportTx]].
   *
   * @remarks
   * This helper exists because the endpoint API should be the primary point of entry for most functionality.
   */
  buildImportTx = async (
    utxoset: UTXOSet, 
    toAddress: string,
    ownerAddresses: string[],
    sourceChain: Buffer | string,
    fromAddresses: string[]
  ): Promise<UnsignedTx> => {
    const from: Buffer[] = this._cleanAddressArray(fromAddresses, 'buildImportTx').map((a) => bintools.stringToAddress(a));
    let srcChain: string = undefined;

    if(typeof sourceChain === "string") {
      // if there is a sourceChain passed in and it's a string then save the string value and cast the original
      // variable from a string to a Buffer
      srcChain = sourceChain;
      sourceChain = bintools.cb58Decode(sourceChain);
    } else if(typeof sourceChain === "undefined" || !(sourceChain instanceof Buffer)) {
      // if there is no sourceChain passed in or the sourceChain is any data type other than a Buffer then throw an error
      throw new Error('Error - EVMAPI.buildImportTx: sourceChain is undefined or invalid sourceChain type.');
    }
    const utxoResponse: UTXOResponse = await this.getUTXOs(ownerAddresses, srcChain, 0, undefined);
    const atomicUTXOs: UTXOSet = utxoResponse.utxos;
    const avaxAssetID: Buffer = await this.getAVAXAssetID();
    const atomics: UTXO[] = atomicUTXOs.getAllUTXOs();

    if(atomics.length === 0){
      throw new Error(`Error - EVMAPI.buildImportTx: no atomic utxos to import from ${srcChain} using addresses: ${ownerAddresses.join(', ')}`);
    }

    const builtUnsignedTx: UnsignedTx = utxoset.buildImportTx(
      this.core.getNetworkID(),
      bintools.cb58Decode(this.blockchainID), 
      [toAddress],
      from,
      atomics,
      sourceChain,
      this.getTxFee(),
      avaxAssetID
    );

    return builtUnsignedTx;
  };

  /**
   * Helper function which creates an unsigned Export Tx. For more granular control, you may create your own
   * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
   *
   * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
   * @param assetID The asset id which is being sent
   * @param destinationChain The chainid for where the assets will be sent.
   * @param toAddresses The addresses to send the funds
   * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param locktime Optional. The locktime field created in the resulting outputs
   * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
   *
   * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[ExportTx]].
   */
  buildExportTx = async (
    amount: BN,
    assetID: Buffer | string,
    destinationChain: Buffer | string,
    fromAddressHex: string, 
    fromAddressBech: string, 
    toAddresses: string[],
    nonce: number = 0,
    locktime: BN = new BN(0), 
    threshold: number = 1
  ): Promise<UnsignedTx> => { 

    let prefixes: object = {};
    toAddresses.map((address: string) => {
      prefixes[address.split("-")[0]] = true;
    });
    if(Object.keys(prefixes).length !== 1){
      throw new Error("Error - EVMAPI.buildExportTx: To addresses must have the same chainID prefix.");
    }
    
    if(typeof destinationChain === "undefined") {
      throw new Error("Error - EVMAPI.buildExportTx: Destination ChainID is undefined.");
    } else if (typeof destinationChain === "string") {
      destinationChain = bintools.cb58Decode(destinationChain); 
    } else if(!(destinationChain instanceof Buffer)) {
      throw new Error(`Error - EVMAPI.buildExportTx: Invalid destinationChain type: ${typeof destinationChain}`);
    }
    if(destinationChain.length !== 32) {
      throw new Error("Error - EVMAPI.buildExportTx: Destination ChainID must be 32 bytes in length.");
    }
    const fee: BN = this.getTxFee();

    const assetDescription: any = await this.getAssetDescription("AVAX");
    const evmInputs: EVMInput[] = [];
    if(bintools.cb58Encode(assetDescription.assetID) === assetID) {
      const evmInput: EVMInput = new EVMInput(fromAddressHex, amount.add(fee), assetID, nonce);
      evmInput.addSignatureIdx(0, bintools.stringToAddress(fromAddressBech));
      evmInputs.push(evmInput);
    } else {
      // if asset id isn't AVAX asset id then create 2 inputs
      // first input will be AVAX and will be for the amount of the fee
      // second input will be the ANT
      const evmAVAXInput: EVMInput = new EVMInput(fromAddressHex, fee, assetDescription.assetID, nonce);
      evmAVAXInput.addSignatureIdx(0, bintools.stringToAddress(fromAddressBech));
      evmInputs.push(evmAVAXInput);

      const evmANTInput: EVMInput = new EVMInput(fromAddressHex, amount, assetID, nonce);
      evmANTInput.addSignatureIdx(0, bintools.stringToAddress(fromAddressBech));
      evmInputs.push(evmANTInput);
    }

    const to: Buffer[] = [];
    toAddresses.map((address: string) => {
      to.push(bintools.stringToAddress(address));
    });

    let exportedOuts: TransferableOutput[] = [];
    const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(amount, to, locktime, threshold);
    const transferableOutput: TransferableOutput = new TransferableOutput(bintools.cb58Decode(assetID), secpTransferOutput);
    exportedOuts.push(transferableOutput);

    // lexicographically sort array
    exportedOuts = exportedOuts.sort(TransferableOutput.comparator());

    const exportTx: ExportTx = new ExportTx(
      this.core.getNetworkID(), 
      bintools.cb58Decode(this.blockchainID), 
      destinationChain,
      evmInputs,
      exportedOuts
    );

    const unsignedTx: UnsignedTx = new UnsignedTx(exportTx);
    return unsignedTx;
  };

  /**
   * Gets a reference to the keychain for this class.
   *
   * @returns The instance of [[KeyChain]] for this class
   */
  keyChain = (): KeyChain => this.keychain;

  /**
   * @ignore
   */
  protected _cleanAddressArray(addresses: string[] | Buffer[], caller: string): string[] {
    const addrs: string[] = [];
    const chainid: string = this.getBlockchainAlias() ? this.getBlockchainAlias() : this.getBlockchainID();
    if (addresses && addresses.length > 0) {
      addresses.forEach((address: string | Buffer) => {
        if (typeof address === 'string') {
          if (typeof this.parseAddress(address as string) === 'undefined') {
            /* istanbul ignore next */
            throw new Error(`Error - EVMAPI.${caller}: Invalid address format ${address}`);
          }
          addrs.push(address as string);
        } else {
          addrs.push(bintools.addressToString(this.core.getHRP(), chainid, address as Buffer));
        }
      });
    }
    return addrs;
  }

  /**
   * This class should not be instantiated directly.
   * Instead use the [[Avalanche.addAPI]] method.
   *
   * @param core A reference to the Avalanche class
   * @param baseurl Defaults to the string "/ext/bc/C/avax" as the path to blockchain's baseurl
   * @param blockchainID The Blockchain's ID. Defaults to an empty string: ''
   */
  constructor(core: AvalancheCore, baseurl: string = '/ext/bc/C/avax', blockchainID: string = '') { 
    super(core, baseurl); 
    this.blockchainID = blockchainID;
    const netID: number = core.getNetworkID();
    if (netID in Defaults.network && blockchainID in Defaults.network[netID]) {
      const { alias } = Defaults.network[netID][blockchainID];
      this.keychain = new KeyChain(this.core.getHRP(), alias);
    } else {
      this.keychain = new KeyChain(this.core.getHRP(), blockchainID);
    }
  }
}
