/**
 * @packageDocumentation
 * @module PlatformVMAPI
 */
import { Buffer } from 'buffer/';
import BN from 'bn.js';
import AvalancheCore from '../../avalanche';
import { JRPCAPI, RequestResponseData } from '../../utils/types';
import BinTools from '../../utils/bintools';

/**
 * @ignore
 */
const bintools:BinTools = BinTools.getInstance();

/**
 * Class for interacting with a node's PlatformVMAPI
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
class PlatformVMAPI extends JRPCAPI {
  /**
   * Creates a new blockchain.
   *
   * @param vmID The ID of the Virtual Machine the blockchain runs. Can also be an alias of the Virtual Machine.
   * @param name A human-readable name for the new blockchain
   * @param payerNonce The next unused nonce of the account paying the transaction fee
   * @param genesis The base 58 (with checksum) representation of the genesis state of the new blockchain. Virtual Machines should have a static API method named buildGenesis that can be used to generate genesisData.
   * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an cb58 serialized string for the SubnetID or its alias.
   *
   * @returns Promise for the unsigned transaction to create this blockchain. Must be signed by a sufficient number of the Subnet’s control keys and by the account paying the transaction fee.
   */
  createBlockchain = async (vmID:string,
    name:string,
    payerNonce: number,
    genesis:string,
    subnetID:Buffer | string = undefined)
  :Promise<string> => {
    const params:any = {
      vmID,
      name,
      payerNonce,
      genesisData: genesis,
    };
    if (typeof subnetID === 'string') {
      params.subnetID = subnetID;
    } else if (typeof subnetID !== 'undefined') {
      params.subnetID = bintools.cb58Encode(subnetID);
    }
    return this.callMethod('platform.createBlockchain', params)
      .then((response:RequestResponseData) => response.data.result.blockchainID);
  };

  /**
   * Creates a new blockchain.
   *
   * @param blockchainID The blockchainID requesting a status update
   *
   * @returns Promise for a string of one of: "Validating", "Created", "Preferred", "Unknown".
   */
  getBlockchainStatus = async (blockchainID: string):Promise<string> => {
    const params:any = {
      blockchainID,
    };
    return this.callMethod('platform.getBlockchainStatus', params)
      .then((response:RequestResponseData) => response.data.result.status);
  };

  /**
   * The P-Chain uses an account model. This method creates a P-Chain account on an existing user in the Keystore.
   *
   * @param username The username of the Keystore user that controls the new account
   * @param password The password of the Keystore user that controls the new account
   * @param privateKey The private key that controls the account. If omitted, a new private key is generated
   *
   * @returns Promise for a string of the newly created account address.
   */
  createAccount = async (username: string,
    password:string,
    privateKey:Buffer | string = undefined)
  :Promise<string> => {
    const params:any = {
      username,
      password,
    };
    if (typeof privateKey === 'string') {
      params.privateKey = privateKey;
    } else if (typeof privateKey !== 'undefined') {
      params.privateKey = bintools.cb58Encode(privateKey);
    }
    return this.callMethod('platform.createAccount', params)
      .then((response:RequestResponseData) => response.data.result.address);
  };

  /**
   * The P-Chain uses an account model. An account is identified by an address. This method returns the account with the given address.
   *
   * @param address The address of the account
   *
   * @returns Promise for an object containing the address, the nonce, and the balance.
   */
  getAccount = async (address: string):Promise<object> => {
    const params:any = {
      address,
    };
    return this.callMethod('platform.getAccount', params)
      .then((response:RequestResponseData) => response.data.result);
  };

  /**
   * List the accounts controlled by the user in the Keystore.
   *
   * @param username The username of the Keystore user
   * @param password The password of the Keystore user
   *
   * @returns Promise for an array of accounts.
   */
  listAccounts = async (username: string, password:string):Promise<Array<object>> => {
    const params:any = {
      username,
      password,
    };
    return this.callMethod('platform.listAccounts', params)
      .then((response:RequestResponseData) => response.data.result.accounts);
  };

  /**
   * Lists the set of current validators.
   *
   * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an
   * cb58 serialized string for the SubnetID or its alias.
   *
   * @returns Promise for an array of validators that are currently staking, see: {@link https://docs.avax.network/v1.0/en/api/platform/#platformgetcurrentvalidators|platform.getCurrentValidators documentation}.
   *
   */
  getCurrentValidators = async (subnetID:Buffer | string = undefined):Promise<Array<object>> => {
    const params:any = {};
    if (typeof subnetID === 'string') {
      params.subnetID = subnetID;
    } else if (typeof subnetID !== 'undefined') {
      params.subnetID = bintools.cb58Encode(subnetID);
    }
    return this.callMethod('platform.getCurrentValidators', params)
      .then((response:RequestResponseData) => response.data.result.validators);
  };

  /**
   * Lists the set of pending validators.
   *
   * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer}
   * or a cb58 serialized string for the SubnetID or its alias.
   *
   * @returns Promise for an array of validators that are pending staking, see: {@link https://docs.avax.network/v1.0/en/api/platform/#platformgetpendingvalidators|platform.getPendingValidators documentation}.
   *
   */
  getPendingValidators = async (subnetID:Buffer | string = undefined):Promise<Array<object>> => {
    const params:any = {};
    if (typeof subnetID === 'string') {
      params.subnetID = subnetID;
    } else if (typeof subnetID !== 'undefined') {
      params.subnetID = bintools.cb58Encode(subnetID);
    }

    return this.callMethod('platform.getPendingValidators', params)
      .then((response:RequestResponseData) => response.data.result.validators);
  };

  /**
   * Samples `Size` validators from the current validator set.
   *
   * @param sampleSize Of the total universe of validators, select this many at random
   * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an
   * cb58 serialized string for the SubnetID or its alias.
   *
   * @returns Promise for an array of validator's stakingIDs.
   */
  sampleValidators = async (sampleSize:number,
    subnetID:Buffer | string = undefined)
  :Promise<Array<string>> => {
    const params:any = {
      size: sampleSize.toString(),
    };
    if (typeof subnetID === 'string') {
      params.subnetID = subnetID;
    } else if (typeof subnetID !== 'undefined') {
      params.subnetID = bintools.cb58Encode(subnetID);
    }
    return this.callMethod('platform.sampleValidators', params)
      .then((response:RequestResponseData) => response.data.result.validators);
  };

  /**
   * Add a validator to the Default Subnet.
   *
   * @param id The node ID of the validator
   * @param startTime Javascript Date object for the start time to validate
   * @param endTime Javascript Date object for the end time to validate
   * @param stakeAmount The amount of nAVAX the validator is staking as
   * a {@link https://github.com/indutny/bn.js/|BN}
   * @param payerNonce The next unused nonce of the account that is providing the staked
   * AVAX and paying the transaction fee
   * @param destination The P-Chain address of the account that the staked AVAX will be returned
   * to, as well as a validation reward if the validator is sufficiently responsive and correct
   * while it validated
   * @param delegationFeeRate Optional. The percent fee this validator charges when others
   * delegate stake to them, multiplied by 10,000 as
   * a {@link https://github.com/indutny/bn.js/|BN}. For example, suppose a validator has
   * delegationFeeRate 300,000 and someone delegates to that validator. When the delegation
   * period is over, if the delegator is entitled to a reward, 30% of the reward
   * (300,000 / 10,000) goes to the validator and 70% goes to the delegator
   * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or
   * an cb58 serialized string for the SubnetID or its alias.
   *
   * @returns Promise for a base58 string of the unsigned transaction.
   */
  addDefaultSubnetValidator = async (id:string,
    startTime:Date,
    endTime:Date,
    stakeAmount:BN,
    payerNonce:number,
    destination:string,
    delegationFeeRate:BN = undefined)
  :Promise<string> => {
    const params:any = {
      id,
      startTime: startTime.getTime() / 1000,
      endTime: endTime.getTime() / 1000,
      stakeAmount: stakeAmount.toString(10),
      payerNonce: Math.floor(payerNonce),
      destination,
    };
    if (typeof delegationFeeRate !== 'undefined') {
      params.delegationFeeRate = delegationFeeRate.toString(10);
    }
    return this.callMethod('platform.addDefaultSubnetValidator', params)
      .then((response:RequestResponseData) => response.data.result.unsignedTx);
  };

  /**
   * Add a validator to a Subnet other than the Default Subnet. The validator must validate the Default Subnet for the entire duration they validate this Subnet.
   *
   * @param id The node ID of the validator
   * @param subnetID Either a {@link https://github.com/feross/buffer|Buffer} or a cb58 serialized string for the SubnetID or its alias.
   * @param startTime Javascript Date object for the start time to validate
   * @param endTime Javascript Date object for the end time to validate
   * @param weight The validator’s weight used for sampling
   * @param payerNonce The next unused nonce of the account that is providing the staked AVAX and paying the transaction fee
   *
   * @returns Promise for the unsigned transaction. It must be signed (using sign) by the proper number of the Subnet’s control keys and by the key of the account paying the transaction fee before it can be issued.
   */
  addNonDefaultSubnetValidator = async (id:string,
    subnetID:Buffer | string,
    startTime:Date,
    endTime:Date,
    weight:number,
    payerNonce:number)
  :Promise<string> => {
    const params:any = {
      id,
      startTime: startTime.getTime() / 1000,
      endTime: endTime.getTime() / 1000,
      weight,
      payerNonce: Math.floor(payerNonce),
    };
    if (typeof subnetID === 'string') {
      params.subnetID = subnetID;
    } else if (typeof subnetID !== 'undefined') {
      params.subnetID = bintools.cb58Encode(subnetID);
    }
    return this.callMethod('platform.addNonDefaultSubnetValidator', params)
      .then((response:RequestResponseData) => response.data.result.unsignedTx);
  };

  /**
   * Add a delegator to the Default Subnet.
   *
   * @param id The node ID of the delegatee
   * @param startTime Javascript Date object for when the delegator starts delegating
   * @param endTime Javascript Date object for when the delegator starts delegating
   * @param stakeAmount The amount of nAVAX the delegator is staking as
   * a {@link https://github.com/indutny/bn.js/|BN}
   * @param payerNonce The next unused nonce of the account that will provide the staked
   * AVAX and pay the transaction fee
   * @param destination The address of the account the staked AVAX and validation reward
   * (if applicable) are sent to at endTime
   *
   * @returns Promise for an array of validator's stakingIDs.
   */
  addDefaultSubnetDelegator = async (id:string,
    startTime:Date,
    endTime:Date,
    stakeAmount:BN,
    payerNonce:number,
    destination:string)
  :Promise<string> => {
    const params:any = {
      id,
      startTime: startTime.getTime() / 1000,
      endTime: endTime.getTime() / 1000,
      stakeAmount: stakeAmount.toString(10),
      payerNonce: Math.floor(payerNonce),
      destination,
    };
    return this.callMethod('platform.addDefaultSubnetDelegator', params)
      .then((response:RequestResponseData) => response.data.result.unsignedTx);
  };

  /**
   * Create an unsigned transaction to create a new Subnet. The unsigned transaction must be
   * signed with the key of the account paying the transaction fee. The Subnet’s ID is the ID of the transaction that creates it (ie the response from issueTx when issuing the signed transaction).
   *
   * @param controlKeys Array of platform addresses as strings
   * @param threshold To add a validator to this Subnet, a transaction must have threshold
   * signatures, where each signature is from a key whose address is an element of `controlKeys`
   * @param payerNonce The next unused nonce of the account providing the transaction fee
   *
   * @returns Promise for a string with the unsigned transaction encoded as base58.
   */
  createSubnet = async (controlKeys:Array<string>, threshold:number, payerNonce:number)
  :Promise<string> => {
    const params:any = {
      controlKeys,
      threshold,
      payerNonce,
    };
    return this.callMethod('platform.createSubnet', params)
      .then((response:RequestResponseData) => response.data.result.unsignedTx);
  };

  /**
   * Get the Subnet that validates a given blockchain.
   *
   * @param blockchainID Either a {@link https://github.com/feross/buffer|Buffer} or a cb58 
   * encoded string for the blockchainID or its alias.
   *
   * @returns Promise for a string of the subnetID that validates the blockchain.
   */
  validatedBy = async (blockchainID:string):Promise<string> => {
    const params:any = {
      blockchainID,
    };
    return this.callMethod('platform.validatedBy', params)
      .then((response:RequestResponseData) => response.data.result.subnetID);
  };

  /**
   * Get the IDs of the blockchains a Subnet validates.
   *
   * @param subnetID Either a {@link https://github.com/feross/buffer|Buffer} or an AVAX
   * serialized string for the SubnetID or its alias.
   *
   * @returns Promise for an array of blockchainIDs the subnet validates.
   */
  validates = async (subnetID:Buffer | string):Promise<Array<string>> => {
    const params:any = {
      subnetID,
    };
    if (typeof subnetID === 'string') {
      params.subnetID = subnetID;
    } else if (typeof subnetID !== 'undefined') {
      params.subnetID = bintools.cb58Encode(subnetID);
    }
    return this.callMethod('platform.validates', params)
      .then((response:RequestResponseData) => response.data.result.blockchainIDs);
  };

  /**
   * Get all the blockchains that exist (excluding the P-Chain).
   *
   * @returns Promise for an array of objects containing fields "id", "subnetID", and "vmID".
   */
  getBlockchains = async ():Promise<Array<object>> => {
    const params:any = {};
    return this.callMethod('platform.getBlockchains', params)
      .then((response:RequestResponseData) => response.data.result.blockchains);
  };

  /**
   * Send AVAX from an account on the P-Chain to an address on the X-Chain. This transaction
   * must be signed with the key of the account that the AVAX is sent from and which pays the
   * transaction fee. After issuing this transaction, you must call the X-Chain’s importAVAX
   * method to complete the transfer.
   *
   * @param to The address on the X-Chain to send the AVAX to. Do not include X- in the address
   * @param amount Amount of AVAX to export as a {@link https://github.com/indutny/bn.js/|BN}
   * @param payerNonce The next unused nonce of the account paying the tx fee and providing
   * the sent AVAX
   *
   * @returns Promise for an unsigned transaction to be signed by the account the the AVAX is
   * sent from and pays the transaction fee.
   */
  exportAVAX = async (amount:BN, to:string, payerNonce:number):Promise<string> => {
    const params:any = {
      to,
      amount: amount.toString(10),
      payerNonce,
    };
    return this.callMethod('platform.exportAVAX', params)
      .then((response:RequestResponseData) => response.data.result.unsignedTx);
  };

  /**
   * Send AVAX from an account on the P-Chain to an address on the X-Chain. This transaction
   * must be signed with the key of the account that the AVAX is sent from and which pays
   * the transaction fee. After issuing this transaction, you must call the X-Chain’s
   * importAVAX method to complete the transfer.
   *
   * @param username The Keystore user that controls the account specified in `to`
   * @param password The password of the Keystore user
   * @param to The ID of the account the AVAX is sent to. This must be the same as the to
   * argument in the corresponding call to the X-Chain’s exportAVAX
   * @param payerNonce The next unused nonce of the account specified in `to`
   *
   * @returns Promise for a string for the transaction, which should be sent to the network
   * by calling issueTx.
   */
  importAVAX = async (username: string, password:string, to:string, payerNonce:number)
  :Promise<string> => {
    const params:any = {
      to,
      payerNonce,
      username,
      password,
    };
    return this.callMethod('platform.importAVAX', params)
      .then((response:RequestResponseData) => response.data.result.tx);
  };

  /**
   * Sign an unsigned or partially signed transaction.
   *
   * Transactions to add non-default Subnets require signatures from control keys and
   * from the account paying the transaction fee. If `signer` is a control key and the
   * transaction needs more signatures from control keys, `sign` will provide a control
   * signature. Otherwise, `signer` will sign to pay the transaction fee.
   *
   * @param username The Keystore user that controls the key signing `tx`
   * @param password The password of the Keystore user
   * @param tx The unsigned/partially signed transaction
   * @param signer The address of the key signing `tx`
   *
   * @returns Promise for an string of the transaction after being signed.
   */
  sign = async (username: string, password:string, tx:string, signer:string):Promise<string> => {
    const params:any = {
      tx,
      signer,
      username,
      password,
    };
    return this.callMethod('platform.sign', params)
      .then((response:RequestResponseData) => response.data.result.tx);
  };

  /**
   * Issue a transaction to the Platform Chain.
   *
   * @param tx The base 58 (with checksum) representation of a transaction
   *
   * @returns Promise for an string of the transaction after being signed.
   */
  issueTx = async (tx:string):Promise<string> => {
    const params:any = {
      tx,
    };
    return this.callMethod('platform.issueTx', params)
      .then((response:RequestResponseData) => response.data.result.txID);
  };

  /**
   * Get all the subnets that exist.
   *
   * @returns Promise for an array of objects containing fields "id",
   * "controlKeys", and "threshold".
   */
  getSubnets = async ():Promise<Array<object>> => {
    const params:any = {};
    return this.callMethod('platform.getSubnets', params)
      .then((response:RequestResponseData) => response.data.result.subnets);
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
    return this.callMethod('platform.exportKey', params)
      .then((response:RequestResponseData) => response.data.result.privateKey);
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
    return this.callMethod('platform.importKey', params)
      .then((response:RequestResponseData) => response.data.result.address);
  };

  /**
   * This class should not be instantiated directly.
   * Instead use the [[Avalanche.addAPI]] method.
   *
   * @param core A reference to the Avalanche class
   * @param baseurl Defaults to the string "/ext/P" as the path to blockchain's baseurl
   */
  constructor(core:AvalancheCore, baseurl:string = '/ext/P') { super(core, baseurl); }
}

export default PlatformVMAPI;
