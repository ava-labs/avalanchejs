/**
 * @packageDocumentation
 * @module AVMAPI
 */
import BN from 'bn.js';
import { Buffer } from 'buffer/';
import AvalancheCore from '../../avalanche';
import BinTools from '../../utils/bintools';
import { JRPCAPI, RequestResponseData, Defaults, MinterSet } from "../../utils/types";
import { UTXOSet, UTXO } from './utxos';
import { MergeRule, UnixNow, AVMConstants, InitialStates } from './types';
import { AVMKeyChain } from './keychain';
import { Tx, UnsignedTx } from './tx';
import { PayloadBase } from '../../utils/payload';
import { TransferableInput, SecpInput } from './inputs';
import { AmountOutput } from './outputs';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * A class for defining the persistance behavior of this an API call.
 *
 */
export class PersistanceOptions {
  protected name:string = undefined;

  protected overwrite:boolean = false;

  protected mergeRule:MergeRule = 'union';

  /**
     * Returns the namespace of the instance
     */
  getName = ():string => this.name;

  /**
     * Returns the overwrite rule of the instance
     */
  getOverwrite = ():boolean => this.overwrite;

  /**
     * Returns the [[MergeRule]] of the instance
     */
  getMergeRule = ():MergeRule => this.mergeRule;

  /**
     *
     * @param name The namespace of the database the data
     * @param overwrite True if the data should be completey overwritten
     * @param MergeRule The type of process used to merge with existing data: "intersection", "differenceSelf", "differenceNew", "symDifference", "union", "unionMinusNew", "unionMinusSelf"
     *
     * @remarks
     * The merge rules are as follows:
     *   * "intersection" - the intersection of the set
     *   * "differenceSelf" - the difference between the existing data and new set
     *   * "differenceNew" - the difference between the new data and the existing set
     *   * "symDifference" - the union of the differences between both sets of data
     *   * "union" - the unique set of all elements contained in both sets
     *   * "unionMinusNew" - the unique set of all elements contained in both sets, excluding values only found in the new set
     *   * "unionMinusSelf" - the unique set of all elements contained in both sets, excluding values only found in the existing set
     */
  constructor(name:string, overwrite:boolean = false, mergeRule:MergeRule) {
    this.name = name;
    this.overwrite = overwrite;
    this.mergeRule = mergeRule;
  }
}

/**
 * Class for interacting with a node endpoint that is using the AVM.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
class AVMAPI extends JRPCAPI {
  /**
     * @ignore
     */
  protected keychain:AVMKeyChain = new AVMKeyChain('', '');

  protected blockchainID:string = '';

  protected AVAXAssetID:Buffer = undefined;

  /**
     * Gets the alias for the blockchainID if it exists, otherwise returns `undefined`.
     *
     * @returns The alias for the blockchainID
     */
  getBlockchainAlias = ():string => {
    const netid:number = this.core.getNetworkID();
    if (netid in Defaults.network && this.blockchainID in Defaults.network[netid]) {
      return Defaults.network[netid][this.blockchainID].alias;
    }
    /* istanbul ignore next */
    return undefined;
  };

  /**
     * Gets the blockchainID and returns it.
     *
     * @returns The blockchainID
     */
  getBlockchainID = ():string => this.blockchainID;

  /**
     * Refresh blockchainID, and if a blockchainID is passed in, use that.
     *
     * @param Optional. BlockchainID to assign, if none, uses the default based on networkID.
     *
     * @returns The blockchainID
     */
  refreshBlockchainID = (blockchainID:string = undefined):boolean => {
    const netid:number = this.core.getNetworkID();
    if (typeof blockchainID === 'undefined' && typeof Defaults.network[netid] !== "undefined") {
      this.blockchainID = Defaults.network[netid].avm.blockchainID;
      return true;
    } if (typeof blockchainID === 'string') {
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
  parseAddress = (addr:string):Buffer => {
    const alias:string = this.getBlockchainAlias();
    const blockchainID:string = this.getBlockchainID();
    return bintools.parseAddress(addr, blockchainID, alias, AVMConstants.ADDRESSLENGTH);
  };

  addressFromBuffer = (address:Buffer):string => {
    const chainid:string = this.getBlockchainAlias() ? this.getBlockchainAlias() : this.getBlockchainID();
    return bintools.addressToString(this.core.getHRP(), chainid, address);
  };

  /**
     * Fetches the AVAX AssetID and returns it in a Promise.
     *
     * @returns The the provided string representing the blockchainID
     */
  getAVAXAssetID = async ():Promise<Buffer> => {
    if (typeof this.AVAXAssetID === 'undefined') {
      const asset:{
        name: string;
        symbol: string;
        assetID: Buffer;
        denomination: number;
      } = await this.getAssetDescription('AVAX');
      // TODO - Remove hardcoded 'AVAX'
      this.AVAXAssetID = asset.assetID;
    }
    return this.AVAXAssetID;
  };

  /**
     * Gets a reference to the keychain for this class.
     *
     * @returns The instance of [[AVMKeyChain]] for this class
     */
  keyChain = ():AVMKeyChain => this.keychain;

  /**
     * @ignore
     */
  newKeyChain = ():AVMKeyChain => {
    // warning, overwrites the old keychain
    const alias = this.getBlockchainAlias();
    if (alias) {
      this.keychain = new AVMKeyChain(this.core.getHRP(), alias);
    } else {
      this.keychain = new AVMKeyChain(this.core.getHRP(), this.blockchainID);
    }
    return this.keychain;
  };

  /**
   * Helper function which determines if a tx is a goose egg transaction. 
   *
   * @param utx An UnsignedTx
   *
   * @returns boolean true if passes goose egg test and false if fails.
   *
   * @remarks
   * A "Goose Egg Transaction" is when the fee far exceeds a reasonable amount
   */
  checkGooseEgg = async (utx:UnsignedTx): Promise<boolean> => {
    const avaxAssetID:Buffer = await this.getAVAXAssetID();
    const outputTotal:BN = utx.getOutputTotal(avaxAssetID);
    const fee:BN = utx.getBurn(avaxAssetID);

    if(fee.lte(AVMConstants.ONEAVAX.mul(new BN(10))) || fee.lte(outputTotal)) {
      return true;
    } else {
      return false;
    }
  }

  /**
     * Gets the balance of a particular asset on a blockchain.
     *
     * @param address The address to pull the asset balance from
     * @param assetID The assetID to pull the balance from
     *
     * @returns Promise with the balance of the assetID as a {@link https://github.com/indutny/bn.js/|BN} on the provided address for the blockchain.
     */
  getBalance = async (address:string, assetID:string):Promise<BN> => {
    if (typeof this.parseAddress(address) === 'undefined') {
      /* istanbul ignore next */
      throw new Error(`Error - AVMAPI.getBalance: Invalid address format ${address}`);
    }
    const params:any = {
      address,
      assetID,
    };
    return this.callMethod('avm.getBalance', params).then((response:RequestResponseData) => new BN(response.data.result.balance, 10));
  };

  /**
     * Creates an address (and associated private keys) on a user on a blockchain.
     *
     * @param username Name of the user to create the address under
     * @param password Password to unlock the user and encrypt the private key
     *
     * @returns Promise for a string representing the address created by the vm.
     */
  createAddress = async (username:string, password:string):Promise<string> => {
    const params:any = {
      username,
      password,
    };
    return this.callMethod('avm.createAddress', params).then((response:RequestResponseData) => response.data.result.address);
  };

  /**
     * Create a new fixed-cap, fungible asset. A quantity of it is created at initialization and there no more is ever created.
     *
     * @param username The user paying the transaction fee (in $AVAX) for asset creation
     * @param password The password for the user paying the transaction fee (in $AVAX) for asset creation
     * @param name The human-readable name for the asset
     * @param symbol Optional. The shorthand symbol for the asset. Between 0 and 4 characters
     * @param denomination Optional. Determines how balances of this asset are displayed by user interfaces. Default is 0
     * @param initialHolders An array of objects containing the field "address" and "amount" to establish the genesis values for the new asset
     *
     * ```js
     * Example initialHolders:
     * [
     *     {
     *         "address": "X-7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh",
     *         "amount": 10000
     *     },
     *     {
     *         "address": "X-7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh",
     *         "amount": 50000
     *     }
     * ]
     * ```
     *
     * @returns Returns a Promise<string> containing the base 58 string representation of the ID of the newly created asset.
     */
  createFixedCapAsset = async (username:string, password:string, name:string, symbol:string, denomination:number, initialHolders:Array<object>):Promise<string> => {
    const params:any = {
      name,
      symbol,
      denomination,
      username,
      password,
      initialHolders,
    };
    return this.callMethod('avm.createFixedCapAsset', params).then((response:RequestResponseData) => response.data.result.assetID);
  };

  /**
     * Create a new variable-cap, fungible asset. No units of the asset exist at initialization. Minters can mint units of this asset using createMintTx, signMintTx and sendMintTx.
     *
     * @param username The user paying the transaction fee (in $AVAX) for asset creation
     * @param password The password for the user paying the transaction fee (in $AVAX) for asset creation
     * @param name The human-readable name for the asset
     * @param symbol Optional. The shorthand symbol for the asset -- between 0 and 4 characters
     * @param denomination Optional. Determines how balances of this asset are displayed by user interfaces. Default is 0
     * @param minterSets is a list where each element specifies that threshold of the addresses in minters may together mint more of the asset by signing a minting transaction
     * 
     * ```js
     * Example minterSets:
     * [
     *      {
     *          "minters":[
     *              "X-4peJsFvhdn7XjhNF4HWAQy6YaJts27s9q"
     *          ],
     *          "threshold": 1
     *      },
     *      {
     *          "minters": [
     *              "X-dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF",
     *              "X-2fE6iibqfERz5wenXE6qyvinsxDvFhHZk",
     *              "X-7ieAJbfrGQbpNZRAQEpZCC1Gs1z5gz4HU"
     *          ],
     *          "threshold": 2
     *      }
     * ]
     * ```
     *
     * @returns Returns a Promise<string> containing the base 58 string representation of the ID of the newly created asset.
     */
  createVariableCapAsset = async (username:string, password:string, name:string, symbol:string, denomination:number, minterSets:Array<object>):Promise<string> => {
    const params:any = {
      name,
      symbol,
      denomination,
      username,
      password,
      minterSets,
    };
    return this.callMethod('avm.createVariableCapAsset', params).then((response:RequestResponseData) => response.data.result.assetID);
  };

  /**
     * Create an unsigned transaction to mint more of an asset.
     *
     * @param amount The units of the asset to mint
     * @param assetID The ID of the asset to mint
     * @param to The address to assign the units of the minted asset
     * @param minters Addresses of the minters responsible for signing the transaction
     *
     * @returns Returns a Promise<string> containing the base 58 string representation of the unsigned transaction.
     */
  createMintTx = async (amount:number | BN, assetID:Buffer | string, to:string, minters:Array<string>):Promise<string> => {
    let asset:string;
    let amnt:BN;
    if (typeof assetID !== 'string') {
      asset = bintools.cb58Encode(assetID);
    } else {
      asset = assetID;
    }
    if (typeof amount === 'number') {
      amnt = new BN(amount);
    } else {
      amnt = amount;
    }
    const params:any = {
      amount: amnt.toString(10),
      assetID: asset,
      to,
      minters,
    };
    return this.callMethod('avm.createMintTx', params).then((response:RequestResponseData) => response.data.result.tx);
  };

  /**
     * Sign an unsigned or partially signed mint transaction.
     *
     * @param username The user signing
     * @param password The password for the user signing
     * @param tx The output of createMintTx or signMintTx
     * @param minter The minter signing this transaction
     *
     * @returns Returns a Promise<string> containing the base 58 string representation of the unsigned transaction.
     */
  signMintTx = async (username:string, password:string, tx:string | Buffer, minter:string):Promise<string> => {
    if (typeof this.parseAddress(minter) === 'undefined') {
      /* istanbul ignore next */
      throw new Error(`Error - AVMAPI.signMintTx: Invalid address format ${minter}`);
    }
    const params:any = {
      username,
      password,
      tx,
      minter,
    };
    return this.callMethod('avm.signMintTx', params).then((response:RequestResponseData) => response.data.result.tx);
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
  exportKey = async (username:string, password:string, address:string):Promise<string> => {
    if (typeof this.parseAddress(address) === 'undefined') {
      /* istanbul ignore next */
      throw new Error(`Error - AVMAPI.exportKey: Invalid address format ${address}`);
    }
    const params:any = {
      username,
      password,
      address,
    };
    return this.callMethod('avm.exportKey', params).then((response:RequestResponseData) => response.data.result.privateKey);
  };

  /**
     * Imports a private key into the node's keystore under an user and for a blockchain.
     *
     * @param username The name of the user to store the private key
     * @param password The password that unlocks the user
     * @param privateKey A string representing the private key in the vm's format
     *
     * @returns The address for the imported private key.
     */
  importKey = async (username:string, password:string, privateKey:string):Promise<string> => {
    const params:any = {
      username,
      password,
      privateKey,
    };
    return this.callMethod('avm.importKey', params).then((response:RequestResponseData) => response.data.result.address);
  };

  /**
     * Send AVAX from the X-Chain to an account on the P-Chain.
     *
     * After calling this method, you must call the P-Chain’s importAVAX method to complete the transfer.
     *
     * @param username The Keystore user that controls the P-Chain account specified in `to`
     * @param password The password of the Keystore user
     * @param to The account on the P-Chain to send the AVAX to. Do not include P- in the address
     * @param amount Amount of AVAX to export as a {@link https://github.com/indutny/bn.js/|BN}
     *
     * @returns String representing the transaction id
     */
  exportAVAX = async (username: string, password:string, to:string, amount:BN):Promise<string> => {
    const params:any = {
      to,
      amount: amount.toString(10),
      username,
      password,
    };
    return this.callMethod('avm.exportAVAX', params).then((response:RequestResponseData) => response.data.result.txID);
  };

  /**
     * Finalize a transfer of AVAX from the P-Chain to the X-Chain.
     *
     * Before this method is called, you must call the P-Chain’s `exportAVAX` method to initiate the transfer.
     *
     * @param to The address the AVAX is sent to. This must be the same as the to argument in the corresponding call to the P-Chain’s exportAVAX, except that the prepended X- should be included in this argument
     * @param username The Keystore user that controls the address specified in `to`
     * @param password The password of the Keystore user
     *
     * @returns String representing the transaction id
     */
  importAVAX = async (username: string, password:string, to:string):Promise<string> => {
    const params:any = {
      to,
      username,
      password,
    };
    return this.callMethod('avm.importAVAX', params).then((response:RequestResponseData) => response.data.result.txID);
  };

  /**
     * Lists all the addresses under a user.
     *
     * @param username The user to list addresses
     * @param password The password of the user to list the addresses
     *
     * @returns Promise of an array of address strings in the format specified by the blockchain.
     */
  listAddresses = async (username:string, password:string): Promise<Array<string>> => {
    const params:any = {
      username,
      password,
    };
    return this.callMethod('avm.listAddresses', params).then((response:RequestResponseData) => response.data.result.addresses);
  };

  /**
     * Retrieves all assets for an address on a server and their associated balances.
     *
     * @param address The address to get a list of assets
     *
     * @returns Promise of an object mapping assetID strings with {@link https://github.com/indutny/bn.js/|BN} balance for the address on the blockchain.
     */
  getAllBalances = async (address:string):Promise<Array<object>> => {
    if (typeof this.parseAddress(address) === 'undefined') {
      /* istanbul ignore next */
      throw new Error(`Error - AVMAPI.getAllBalances: Invalid address format ${address}`);
    }
    const params:any = {
      address,
    };
    return this.callMethod('avm.getAllBalances', params).then((response:RequestResponseData) => response.data.result.balances);
  };

  /**
     * Retrieves an assets name and symbol.
     *
     * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an b58 serialized string for the AssetID or its alias.
     *
     * @returns Returns a Promise<object> with keys "name" and "symbol".
     */
  getAssetDescription = async (assetID:Buffer | string):Promise<{name:string;symbol:string;assetID:Buffer;denomination:number}> => {
    let asset:string;
    if (typeof assetID !== 'string') {
      asset = bintools.cb58Encode(assetID);
    } else {
      asset = assetID;
    }
    const params:any = {
      assetID: asset,
    };
    return this.callMethod('avm.getAssetDescription', params).then((response:RequestResponseData) => ({
      name: response.data.result.name,
      symbol: response.data.result.symbol,
      assetID: bintools.cb58Decode(response.data.result.assetID),
      denomination: parseInt(response.data.result.denomination, 10),
    }));
  };

  /**
     * Returns the treansaction data of a provided transaction ID by calling the node's `getTx` method.
     *
     * @param txid The string representation of the transaction ID
     *
     * @returns Returns a Promise<string> containing the bytes retrieved from the node
     */
    getTx = async (txid:string):Promise<string> => {
      const params:any = {
        txID: txid,
      };
      return this.callMethod('avm.getTx', params).then((response:RequestResponseData) => response.data.result.tx);
    };

  /**
     * Returns the status of a provided transaction ID by calling the node's `getTxStatus` method.
     *
     * @param txid The string representation of the transaction ID
     *
     * @returns Returns a Promise<string> containing the status retrieved from the node
     */
  getTxStatus = async (txid:string):Promise<string> => {
    const params:any = {
      txID: txid,
    };
    return this.callMethod('avm.getTxStatus', params).then((response:RequestResponseData) => response.data.result.status);
  };

  /**
     * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
     *
     * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
     * @param persistOpts Options available to persist these UTXOs in local storage
     *
     * @remarks
     * persistOpts is optional and must be of type [[PersistanceOptions]]
     *
     */
  getUTXOs = async (addresses:Array<string> | Array<Buffer>, persistOpts:PersistanceOptions = undefined):Promise<UTXOSet> => {
    const addrs:Array<string> = this._cleanAddressArray(addresses, 'getUTXOs');

    const params:any = {
      addresses: addrs,
    };
    return this.callMethod('avm.getUTXOs', params).then((response:RequestResponseData) => {
      const utxos:UTXOSet = new UTXOSet();
      let data = response.data.result.utxos;
      if (persistOpts && typeof persistOpts === 'object') {
        if (this.db.has(persistOpts.getName())) {
          const selfArray:Array<string> = this.db.get(persistOpts.getName());
          if (Array.isArray(selfArray)) {
            utxos.addArray(data);
            const self:UTXOSet = new UTXOSet();
            self.addArray(selfArray);
            self.mergeByRule(utxos, persistOpts.getMergeRule());
            data = self.getAllUTXOStrings();
          }
        }
        this.db.set(persistOpts.getName(), data, persistOpts.getOverwrite());
      }
      utxos.addArray(data);
      return utxos;
    });
  };

  /**
     * Retrieves the UTXOs able to be imported by the addresses, provided from the node's `getAtomicUTXOs` method.
     *
     * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
     * @param persistOpts Options available to persist these UTXOs in local storage
     *
     * @remarks
     * persistOpts is optional and must be of type [[PersistanceOptions]]
     *
     */
    getAtomicUTXOs = async (addresses:Array<string> | Array<Buffer>, persistOpts:PersistanceOptions = undefined):Promise<UTXOSet> => {
      const addrs:Array<string> = this._cleanAddressArray(addresses, 'getAtomicUTXOs');
  
      const params:any = {
        addresses: addrs,
      };
      return this.callMethod('avm.getAtomicUTXOs', params).then((response:RequestResponseData) => {
        const utxos:UTXOSet = new UTXOSet();
        let data = response.data.result.utxos;
        if (persistOpts && typeof persistOpts === 'object') {
          if (this.db.has(persistOpts.getName())) {
            const selfArray:Array<string> = this.db.get(persistOpts.getName());
            if (Array.isArray(selfArray)) {
              utxos.addArray(data);
              const self:UTXOSet = new UTXOSet();
              self.addArray(selfArray);
              self.mergeByRule(utxos, persistOpts.getMergeRule());
              data = self.getAllUTXOStrings();
            }
          }
          this.db.set(persistOpts.getName(), data, persistOpts.getOverwrite());
        }
        utxos.addArray(data);
        return utxos;
      });
    };

  /**
     * Helper function which creates an unsigned transaction. For more granular control, you may create your own
     * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
     *
     * @param utxoset A set of UTXOs that the transaction is built on
     * @param amount The amount of AVAX to be spent in $nAVAX
     * @param toAddresses The addresses to send the funds
     * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
     * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
     * @param assetID The assetID of the value being sent
     * @param memo Optional contains arbitrary bytes, up to 256 bytes
     * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
     * @param locktime Optional. The locktime field created in the resulting outputs
     * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
     *
     * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[BaseTx]].
     *
     * @remarks
     * This helper exists because the endpoint API should be the primary point of entry for most functionality.
     */
  buildBaseTx = async (
    utxoset:UTXOSet, amount:BN, toAddresses:Array<string>, fromAddresses:Array<string>,
    changeAddresses:Array<string>, assetID:Buffer | string = undefined, memo:PayloadBase|Buffer = undefined, asOf:BN = UnixNow(),
    locktime:BN = new BN(0), threshold:number = 1
  ):Promise<UnsignedTx> => {
    const to:Array<Buffer> = this._cleanAddressArray(toAddresses, 'buildBaseTx').map((a) => bintools.stringToAddress(a));
    const from:Array<Buffer> = this._cleanAddressArray(fromAddresses, 'buildBaseTx').map((a) => bintools.stringToAddress(a));
    const change:Array<Buffer> = this._cleanAddressArray(changeAddresses, 'buildBaseTx').map((a) => bintools.stringToAddress(a));

    if (typeof assetID === 'string') {
      assetID = bintools.cb58Decode(assetID);
    }

    if( memo instanceof PayloadBase) {
      memo = memo.getPayload();
    }

    const builtUnsignedTx:UnsignedTx = utxoset.buildBaseTx(
      this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID),
      amount, to, from, change,
      assetID, memo, asOf, locktime, threshold,
    );

    if(! await this.checkGooseEgg(builtUnsignedTx)) {
      /* istanbul ignore next */
      throw new Error("Failed Goose Egg Check");
    }

    return builtUnsignedTx;
  };

  /**
     * Helper function which creates an unsigned NFT Transfer. For more granular control, you may create your own
     * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
     *
     * @param utxoset  A set of UTXOs that the transaction is built on
     * @param utxoid A base58 utxoID or an array of base58 utxoIDs for the nfts this transaction is sending
     * @param toAddresses The addresses to send the NFT
     * @param fromAddresses The addresses being used to send the NFT from the utxoID provided
     * @param feeAmount The amount of fees being paid for this transaction
     * @param feeAddresses The addresses that have the AVAX funds to pay for fees of the UTXO
     * @param memo Optional contains arbitrary bytes, up to 256 bytes
     * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
     * @param locktime Optional. The locktime field created in the resulting outputs
     * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
     *
     * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[NFTTransferTx]].
     *
     * @remarks
     * This helper exists because the endpoint API should be the primary point of entry for most functionality.
     */
  buildNFTTransferTx = async (
    utxoset:UTXOSet, utxoid:string | Array<string>, toAddresses:Array<string>, fromAddresses:Array<string>, feeAmount:BN,
    feeAddresses:Array<string>, memo:PayloadBase|Buffer = undefined, asOf:BN = UnixNow(), locktime:BN = new BN(0), threshold:number = 1,
  ):Promise<UnsignedTx> => {
    const to:Array<Buffer> = this._cleanAddressArray(toAddresses, 'buildNFTTransferTx').map((a) => bintools.stringToAddress(a));
    const from:Array<Buffer> = this._cleanAddressArray(fromAddresses, 'buildNFTTransferTx').map((a) => bintools.stringToAddress(a));
    const feeAddrs:Array<Buffer> = this._cleanAddressArray(feeAddresses, 'buildNFTTransferTx').map((a) => bintools.stringToAddress(a));

    if( memo instanceof PayloadBase) {
      memo = memo.getPayload();
    }
    const avaxAssetID:Buffer = await this.getAVAXAssetID();

    let utxoidArray:Array<string> = [];
    if (typeof utxoid === 'string') {
      utxoidArray = [utxoid];
    } else if (Array.isArray(utxoid)) {
      utxoidArray = utxoid;
    }

    const builtUnsignedTx:UnsignedTx = utxoset.buildNFTTransferTx(
      this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), avaxAssetID,
      feeAmount, feeAddrs, to, from, utxoidArray, memo, asOf, locktime, threshold,
    );

    if(! await this.checkGooseEgg(builtUnsignedTx)) {
      /* istanbul ignore next */
      throw new Error("Failed Goose Egg Check");
    }

    return builtUnsignedTx;
  };

    /**
     * In-Development, do not use: Helper function which creates an unsigned Import Tx. For more granular control, you may create your own
     * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
     *
     * @param utxoset  A set of UTXOs that the transaction is built on
     * @param ownerAddresses The addresses being used to import
     * @param feeAmount The amount of fees being paid for this transaction
     * @param feeAddresses The addresses that have the AVAX funds to pay for fees of the UTXO
     * @param memo Optional contains arbitrary bytes, up to 256 bytes
     * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
     * @param locktime Optional. The locktime field created in the resulting outputs
     * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
     *
     * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[ImportTx]].
     *
     * @remarks
     * This helper exists because the endpoint API should be the primary point of entry for most functionality.
     */
    buildImportTx = async (
      utxoset:UTXOSet, ownerAddresses:Array<string>, feeAmount:BN, 
      feeAddresses:Array<string>, memo:PayloadBase|Buffer = undefined, asOf:BN = UnixNow(), 
    ):Promise<UnsignedTx> => {
      const owners:Array<Buffer> = this._cleanAddressArray(ownerAddresses, 'buildImportTx').map((a) => bintools.stringToAddress(a));
      const feeAddrs:Array<Buffer> = this._cleanAddressArray(feeAddresses, 'buildImportTx').map((a) => bintools.stringToAddress(a));

      const atomicUTXOs:UTXOSet = await this.getAtomicUTXOs(owners);
      const avaxAssetID:Buffer = await this.getAVAXAssetID();
      const avaxAssetIDStr:string = avaxAssetID.toString("hex");


      if( memo instanceof PayloadBase) {
        memo = memo.getPayload();
      }
      
      const atomics = atomicUTXOs.getAllUTXOs();
      const importIns:Array<TransferableInput> = [];
      for(let i:number = 0; i < atomics.length; i++) {
        const utxo:UTXO = atomics[i];
        const assetID:Buffer = utxo.getAssetID();
        if(assetID.toString("hex") === avaxAssetIDStr) {
          const output:AmountOutput = utxo.getOutput() as AmountOutput;
          const amt:BN = output.getAmount().clone();
          const txid:Buffer = utxo.getTxID();
          const outputidx:Buffer = utxo.getOutputIdx();
          const input:SecpInput = new SecpInput(amt);
          const xferin:TransferableInput = new TransferableInput(txid, outputidx, assetID, input);
          const fromAddresses:Array<Buffer> = output.getAddresses(); // Verify correct approach
          const spenders:Array<Buffer> = output.getSpenders(fromAddresses, asOf);
          for (let j = 0; j < spenders.length; j++) {
            const idx:number = output.getAddressIdx(spenders[j]);
            if (idx === -1) {
              /* istanbul ignore next */
              throw new Error('Error - UTXOSet.buildBaseTx: no such '
              + `address in output: ${spenders[j]}`);
            }
            xferin.getInput().addSignatureIdx(idx, spenders[j]);
          }
          importIns.push(xferin);
        }
      }
  
      const builtUnsignedTx:UnsignedTx = utxoset.buildImportTx(
        this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), avaxAssetID,
        feeAmount, feeAddrs, importIns, memo, asOf
      );
  
      if(! await this.checkGooseEgg(builtUnsignedTx)) {
        /* istanbul ignore next */
        throw new Error("Failed Goose Egg Check");
      }
  
      return builtUnsignedTx;
    };

  /**
     * In-Development, do not use: Helper function which creates an unsigned Export Tx. For more granular control, you may create your own
     * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
     *
     * @param utxoset A set of UTXOs that the transaction is built on
     * @param utxoid A base58 utxoID or an array of base58 utxoIDs for the AVAX this transaction is exporting
     * @param feeAmount The amount of fees being paid for this transaction
     * @param feeAddresses The addresses that have the AVAX funds to pay for fees of the UTXO
     * @param memo Optional contains arbitrary bytes, up to 256 bytes
     * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
     *
     * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[ExportTx]].
     *
     * @remarks
     * This helper exists because the endpoint API should be the primary point of entry for most functionality.
     */
    buildExportTx = async (
      utxoset:UTXOSet, utxoid:string | Array<string>, feeAmount:BN,
      feeAddresses:Array<string>, memo:PayloadBase|Buffer = undefined, asOf:BN = UnixNow()
    ):Promise<UnsignedTx> => {
      const feeAddrs:Array<Buffer> = this._cleanAddressArray(feeAddresses, 'buildExportTx').map((a) => bintools.stringToAddress(a));
  
      if( memo instanceof PayloadBase) {
        memo = memo.getPayload();
      }

      const avaxAssetID:Buffer = await this.getAVAXAssetID();
  
      let utxoidArray:Array<string> = [];
      if (typeof utxoid === 'string') {
        utxoidArray = [utxoid];
      } else if (Array.isArray(utxoid)) {
        utxoidArray = utxoid;
      }
  
      const builtUnsignedTx:UnsignedTx = utxoset.buildExportTx(
        this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), avaxAssetID,
        feeAmount, feeAddrs, utxoidArray, memo, asOf
      );
  
      if(! await this.checkGooseEgg(builtUnsignedTx)) {
        /* istanbul ignore next */
        throw new Error("Failed Goose Egg Check");
      }
  
      return builtUnsignedTx;
    };

  /**
     * Creates an unsigned transaction. For more granular control, you may create your own
     * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
     *
     * @param utxoset A set of UTXOs that the transaction is built on
     * @param fee The amount of AVAX to be paid for fees, in $nAVAX
     * @param creatorAddresses The addresses to send the fees
     * @param initialStates The [[InitialStates]] that represent the intial state of a created asset
     * @param name String for the descriptive name of the asset
     * @param symbol String for the ticker symbol of the asset
     * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVAX = 10^9 $nAVAX
     * @param memo Optional contains arbitrary bytes, up to 256 bytes
     * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
     *
     * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[CreateAssetTx]].
     * 
     */
  buildCreateAssetTx = async (
      utxoset:UTXOSet, fee:BN, creatorAddresses:Array<string> | Array<Buffer>, 
      initialStates:InitialStates, name:string, 
      symbol:string, denomination:number, memo:PayloadBase|Buffer = undefined, asOf:BN = UnixNow(),
      locktime:BN = undefined
  ):Promise<UnsignedTx> => {
      let creators:Array<Buffer> = this._cleanAddressArray(creatorAddresses, "buildCreateAssetTx").map(a => bintools.stringToAddress(a));

      if( memo instanceof PayloadBase) {
        memo = memo.getPayload();
      }

      /* istanbul ignore next */
      if(symbol.length > AVMConstants.SYMBOLMAXLEN){
          /* istanbul ignore next */
          throw new Error("Error - AVMAPI.buildCreateAssetTx: Symbols may not exceed length of " + AVMConstants.SYMBOLMAXLEN);
      }
      /* istanbul ignore next */
      if(name.length > AVMConstants.ASSETNAMELEN) {
        /* istanbul ignore next */
        throw new Error("Error - AVMAPI.buildCreateAssetTx: Names may not exceed length of " + AVMConstants.ASSETNAMELEN);
      }

      const avaxAssetID:Buffer = await this.getAVAXAssetID();
      const builtUnsignedTx:UnsignedTx = utxoset.buildCreateAssetTx(
        this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), avaxAssetID,
        fee, creators, initialStates, name, symbol, denomination, memo, asOf
      );
  
      if(! await this.checkGooseEgg(builtUnsignedTx)) {
        /* istanbul ignore next */
        throw new Error("Failed Goose Egg Check");
      }
  
      return builtUnsignedTx;
    };

  /**
   * Creates an unsigned transaction. For more granular control, you may create your own
    * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
    * 
    * @param utxoset A set of UTXOs that the transaction is built on
    * @param fee The amount of AVAX to be paid for fees, in $nAVAX
    * @param feePayingAddresses The addresses to pay the fees
    * @param name String for the descriptive name of the asset
    * @param symbol String for the ticker symbol of the asset
    * @param minterSets is a list where each element specifies that threshold of the addresses in minters may together mint more of the asset by signing a minting transaction
    * @param memo Optional contains arbitrary bytes, up to 256 bytes
    * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
    * @param locktime Optional. The locktime field created in the resulting mint output
    * 
    * ```js
    * Example minterSets:
    * [
    *      {
    *          "minters":[
    *              "X-4peJsFvhdn7XjhNF4HWAQy6YaJts27s9q"
    *          ],
    *          "threshold": 1
    *      },
    *      {
    *          "minters": [
    *              "X-dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF",
    *              "X-2fE6iibqfERz5wenXE6qyvinsxDvFhHZk",
    *              "X-7ieAJbfrGQbpNZRAQEpZCC1Gs1z5gz4HU"
    *          ],
    *          "threshold": 2
    *      }
    * ]
    * ```
    * 
    * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[CreateAssetTx]].
    * 
    */
   buildCreateNFTAssetTx = async (
    utxoset:UTXOSet, fee:BN, feePayingAddresses:Array<string> | Array<Buffer>, 
    name:string, symbol:string, minterSets:MinterSet[], memo:PayloadBase|Buffer = undefined, asOf:BN = UnixNow(), locktime:BN = new BN(0)
      ): Promise<UnsignedTx> => {
    let feeAddrs:Array<Buffer> = this._cleanAddressArray(feePayingAddresses, "buildCreateNFTAssetTx").map(a => bintools.stringToAddress(a));
    
    if( memo instanceof PayloadBase) {
      memo = memo.getPayload();
    }

    if(name.length > AVMConstants.ASSETNAMELEN) {
      /* istanbul ignore next */
        throw new Error("Error - AVMAPI.buildCreateNFTAssetTx: Names may not exceed length of " + AVMConstants.ASSETNAMELEN);
    }
    if(symbol.length > AVMConstants.SYMBOLMAXLEN){
      /* istanbul ignore next */
        throw new Error("Error - AVMAPI.buildCreateNFTAssetTx: Symbols may not exceed length of " + AVMConstants.SYMBOLMAXLEN);
    }
    let avaxAssetID:Buffer = await this.getAVAXAssetID();
    const builtUnsignedTx:UnsignedTx = utxoset.buildCreateNFTAssetTx(
        this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), avaxAssetID,
        fee, feeAddrs, minterSets, name, symbol, memo, asOf, locktime
    );
    if(! await this.checkGooseEgg(builtUnsignedTx)) {
      /* istanbul ignore next */
      throw new Error("Failed Goose Egg Check");
    }
    return builtUnsignedTx;
  }

  /**
   * Creates an unsigned transaction. For more granular control, you may create your own
    * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
    * 
    * @param utxoset  A set of UTXOs that the transaction is built on
    * @param utxoid A base58 utxoID or an array of base58 utxoIDs for the nft mint output this transaction is sending
    * @param toAddresses The addresses to send the nft output
    * @param fromAddresses The addresses being used to send the NFT from the utxoID provided
    * @param fee The amount of fees being paid for this transaction
    * @param feeAddresses The addresses that have the AVAX funds to pay for fees of the UTXO
    * @param groupID Optional. The group this NFT is issued to.
    * @param payload Optional. Data for NFT Payload as either a [[PayloadBase]] or a {@link https://github.com/feross/buffer|Buffer}
    * @param memo Optional contains arbitrary bytes, up to 256 bytes
    * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
    * @param locktime Optional. The locktime field created in the resulting mint output
    * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
    * 
    * 
    * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[OperationTx]].
    * 
    */
  buildCreateNFTMintTx = async (
      utxoset:UTXOSet, utxoid:string|Array<string>, toAddresses:Array<string>|Array<Buffer>, 
      fromAddresses:Array<string>|Array<Buffer>, fee:BN,
      feeAddresses:Array<string>|Array<Buffer>, groupID:number = 0, payload:PayloadBase|Buffer = undefined, 
      memo:PayloadBase|Buffer = undefined, asOf:BN = UnixNow(), locktime:BN = new BN(0), threshold:number = 1
  ): Promise<any> => {
      let to:Array<Buffer> = this._cleanAddressArray(toAddresses, "buildCreateNFTMintTx").map(a => bintools.stringToAddress(a));
      let from:Array<Buffer> = this._cleanAddressArray(fromAddresses, "buildCreateNFTMintTx").map(a => bintools.stringToAddress(a));
      let feeAddrs:Array<Buffer> = this._cleanAddressArray(feeAddresses, "buildCreateNFTMintTx").map(a => bintools.stringToAddress(a));
      
      if( memo instanceof PayloadBase) {
        memo = memo.getPayload();
      }

      if(payload instanceof PayloadBase){
        payload = payload.getPayload();
      }

      if(typeof utxoid === 'string') {
          utxoid = [utxoid];
      }

      let avaxAssetID:Buffer = await this.getAVAXAssetID();

      const builtUnsignedTx:UnsignedTx = utxoset.buildCreateNFTMintTx(
          this.core.getNetworkID(),
          bintools.cb58Decode(this.blockchainID),
          avaxAssetID,
          fee,
          feeAddrs,
          to,
          from,
          utxoid,
          groupID,
          payload,
          memo, 
          asOf,
          locktime,
          threshold
      );
      if(! await this.checkGooseEgg(builtUnsignedTx)) {
        /* istanbul ignore next */
        throw new Error("Failed Goose Egg Check");
      }
      return builtUnsignedTx;
  }

  /**
   * Helper function which takes an unsigned transaction and signs it, returning the resulting [[Tx]].
    *
    * @param utx The unsigned transaction of type [[UnsignedTx]]
    *
    * @returns A signed transaction of type [[Tx]]
    */
  signTx = (utx:UnsignedTx):Tx => this.keychain.signTx(utx);

  /**
     * Calls the node's issueTx method from the API and returns the resulting transaction ID as a string.
     *
     * @param tx A string, {@link https://github.com/feross/buffer|Buffer}, or [[Tx]] representing a transaction
     *
     * @returns A Promise<string> representing the transaction ID of the posted transaction.
     */
  issueTx = async (tx:string | Buffer | Tx):Promise<string> => {
    let Transaction = '';
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
      throw new Error('Error - avm.issueTx: provided tx is not expected type of string, Buffer, or Tx');
    }
    const params:any = {
      tx: Transaction.toString(),
    };
    return this.callMethod('avm.issueTx', params).then((response:RequestResponseData) => response.data.result.txID);
  };

  /**
     * Sends an amount of assetID to the specified address from a list of owned of addresses.
     *
     * @param username The user that owns the private keys associated with the `from` addresses
     * @param password The password unlocking the user
     * @param assetID The assetID of the asset to send
     * @param amount The amount of the asset to be sent
     * @param to The address of the recipient
     * @param from An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
     *
     * @returns Promise for the string representing the transaction's ID.
     */
  send = async (username:string, password:string, assetID:string | Buffer, amount:number | BN, to:string, from:Array<string> | Array<Buffer>):Promise<string> => {
    let asset:string;
    let amnt:BN;

    if (typeof this.parseAddress(to) === 'undefined') {
      /* istanbul ignore next */
      throw new Error(`Error - AVMAPI.sen: Invalid address format ${to}`);
    }

    from = this._cleanAddressArray(from, 'send');

    if (typeof assetID !== 'string') {
      asset = bintools.cb58Encode(assetID);
    } else {
      asset = assetID;
    }
    if (typeof amount === 'number') {
      amnt = new BN(amount);
    } else {
      amnt = amount;
    }

    const params:any = {
      username,
      password,
      assetID: asset,
      amount: amnt.toString(10),
      to,
      from,
    };
    return this.callMethod('avm.send', params).then((response:RequestResponseData) => response.data.result.txID);
  };

  /**
     * Given a JSON representation of this Virtual Machine’s genesis state, create the byte representation of that state.
     *
     * @param genesisData The blockchain's genesis data object
     *
     * @returns Promise of a string of bytes
     */
  buildGenesis = async (genesisData:object):Promise<string> => {
    const params:any = {
      genesisData,
    };
    return this.callMethod('avm.buildGenesis', params).then((response:RequestResponseData) => {
      const r = response.data.result.bytes;
      return r;
    });
  };

  /**
     * @ignore
     */
  protected _cleanAddressArray(addresses:Array<string> | Array<Buffer>, caller:string):Array<string> {
    const addrs:Array<string> = [];
    const chainid:string = this.getBlockchainAlias() ? this.getBlockchainAlias() : this.getBlockchainID();
    if (addresses && addresses.length > 0) {
      for (let i = 0; i < addresses.length; i++) {
        if (typeof addresses[i] === 'string') {
          if (typeof this.parseAddress(addresses[i] as string) === 'undefined') {
            /* istanbul ignore next */
            throw new Error(`Error - AVMAPI.${caller}: Invalid address format ${addresses[i]}`);
          }
          addrs.push(addresses[i] as string);
        } else {
          addrs.push(bintools.addressToString(this.core.getHRP(), chainid, addresses[i] as Buffer));
        }
      }
    }
    return addrs;
  }

  /**
     * This class should not be instantiated directly. Instead use the [[Avalanche.addAPI]] method.
     *
     * @param core A reference to the Avalanche class
     * @param baseurl Defaults to the string "/ext/bc/avm" as the path to blockchain's baseurl
     */
  constructor(core:AvalancheCore, baseurl:string = '/ext/bc/avm', blockchainID:string = '') {
    super(core, baseurl);
    this.blockchainID = blockchainID;
    const netid:number = core.getNetworkID();
    if (netid in Defaults.network && blockchainID in Defaults.network[netid]) {
      const { alias } = Defaults.network[netid][blockchainID];
      this.keychain = new AVMKeyChain(this.core.getHRP(), alias);
    } else {
      this.keychain = new AVMKeyChain(this.core.getHRP(), blockchainID);
    }
  }
}

export default AVMAPI;
