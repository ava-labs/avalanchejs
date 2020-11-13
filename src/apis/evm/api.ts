/**
 * @packageDocumentation
 * @module API-EVM
 */
import BN from 'bn.js';
import AvalancheCore from '../../avalanche';
import { JRPCAPI } from '../../common/jrpcapi';
import { RequestResponseData } from '../../common/apibase';
import BinTools from '../../utils/bintools';

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
   * Send mulitcoin assets including AVAX from the C-Chain to an account on the X-Chain.
    *
    * After calling this method, you must call the X-Chain’s importAVAX method to complete the transfer.
    *
    * @param username The Keystore user that controls the X-Chain account specified in `to`
    * @param password The password of the Keystore user
    * @param to The account on the X-Chain to send the AVAX to. 
    * @param amount Amount of AVAX to export as a {@link https://github.com/indutny/bn.js/|BN}
    * @param destinationChain The chain id where the funds are being sent
    * @param assetID The asset id which is being sent
    *
    * @returns String representing the transaction id
    */
  export = async (username: string, password: string, to: string, amount: BN, destinationChain: string, assetID: string):Promise<string> => {
    const params: any = {
      to,
      amount: amount.toString(10),
      username,
      password,
      destinationChain,
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
    * @param to The account on the X-Chain to send the AVAX to. Do not include X- in the address
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
   * Send multicoin assets including AVAX from an account on the X-Chain to an address on the C-Chain. This transaction
   * must be signed with the key of the account that the AVAX is sent from and which pays
   * the transaction fee.
   *
   * @param username The Keystore user that controls the account specified in `to`
   * @param password The password of the Keystore user
   * @param to The ID of the account the AVAX is sent to. This must be the same as the to
   * argument in the corresponding call to the X-Chain’s exportAVAX
   * @param sourceChain The chainID where the funds are coming from.
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
    return this.callMethod('avax.importAVAX', params)
      .then((response:RequestResponseData) => response.data.result.txID);
  };

  /**
   * Send AVAX from an account on the X-Chain to an address on the C-Chain. This transaction
   * must be signed with the key of the account that the AVAX is sent from and which pays
   * the transaction fee.
   *
   * @param username The Keystore user that controls the account specified in `to`
   * @param password The password of the Keystore user
   * @param to The ID of the account the AVAX is sent to. This must be the same as the to
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
