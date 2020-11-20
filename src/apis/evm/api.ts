/**
 * @packageDocumentation
 * @module API-EVM
 */
import BN from 'bn.js';
import AvalancheCore from '../../avalanche';
import { JRPCAPI } from '../../common/jrpcapi';
import { RequestResponseData } from '../../common/apibase';
import BinTools from '../../utils/bintools';

interface Index {
  address: string,
  utxo: string
}

/**
 * @ignore
 */
const bintools:BinTools = BinTools.getInstance();

/**
 * Class for interacting with a node's EVMAPI 
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
export class EVMAPI extends JRPCAPI {

  protected blockchainID:string = '';

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
  export = async (username: string, password: string, to: string, amount: BN, assetID: string):Promise<string> => {
    const params: any = {
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
  exportAVAX = async (username:string, password:string, to:string, amount:BN):Promise<string> => {
    const params:any = {
      to,
      amount: amount.toString(10),
      username,
      password,
    };
    return this.callMethod('avax.exportAVAX', params).then((response:RequestResponseData) => response.data.result.txID);
  };

  /**
   * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
   *
   * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
   * @param sourceChain A string for the chain to look for the UTXO's. Default is to use this chain, but if exported UTXOs exist from other chains, this can used to pull them instead.
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
  ):Promise<{
    numFetched:number,
    utxos,
    endIndex: Index
  }> => {
    if(typeof addresses === "string") {
      addresses = [addresses];
    }

    const params:any = {
      addresses: addresses,
      limit
    };
    if(typeof startIndex !== "undefined" && startIndex) {
      params.startIndex = startIndex;
    }

    if(typeof sourceChain !== "undefined" && sourceChain) {
      params.sourceChain = sourceChain;
      return this.callMethod('avax.getUTXOs', params).then((response: RequestResponseData) => {
        // const utxos: UTXOSet = new UTXOSet();
        // let data = response.data.result.utxos;
        // utxos.aRRArray(data, false);
        // response.data.result.utxos = utxos;
        return response.data.result;
      });
    };
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
  import = async (username: string, password:string, to:string, sourceChain:string)
  :Promise<string> => {
    const params:any = {
      to,
      sourceChain,
      username,
      password,
    };
    return this.callMethod('avax.import', params)
      .then((response:RequestResponseData) => response.data.result.txID);
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
  importAVAX = async (username: string, password:string, to:string, sourceChain:string)
  :Promise<string> => {
    const params:any = {
      to,
      sourceChain,
      username,
      password,
    };
    return this.callMethod('avax.importAVAX', params)
      .then((response:RequestResponseData) => response.data.result.txID);
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
  importKey = async (username:string, password:string, privateKey:string):Promise<string> => {
    const params:any = {
      username,
      password,
      privateKey,
    };
    return this.callMethod('avax.importKey', params)
      .then((response:RequestResponseData) => response.data.result.address);
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
    const params:any = {
      username,
      password,
      address,
    };
    return this.callMethod('avax.exportKey', params)
      .then((response:RequestResponseData) => response.data.result.privateKey);
  };

  /**
   * This class should not be instantiated directly.
   * Instead use the [[Avalanche.addAPI]] method.
   *
   * @param core A reference to the Avalanche class
   * @param baseurl Defaults to the string "/ext/bc/C/avax" as the path to blockchain's baseurl
   * @param blockchainID The Blockchain's ID. Defaults to an empty string: ''
   */
  constructor(core:AvalancheCore, baseurl:string = '/ext/bc/C/avax', blockchainID:string = '') { 
    super(core, baseurl); 
    this.blockchainID = blockchainID;
  }
}
