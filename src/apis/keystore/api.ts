/**
 * @module KeystoreAPI
 */
import SlopesCore from '../../slopes';
import {JRPCAPI, RequestResponseData} from "../../utils/types"

/**
 * Class for interacting with a node API that is using the node's KeystoreAPI.
 * 
 * **WARNING**: The KeystoreAPI is to be used by the node-owner as the data is stored locally on the node. Do not trust the root user. If you are not the node-owner, do not use this as your wallet. 
 * 
 * @category RPCAPIs
 * 
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Slopes.addAPI]] function to register this interface with Slopes.
 */ 
class KeystoreAPI extends JRPCAPI{

    /**
     * Creates a account in the node's database.
     * 
     * @param accountName Name of the account to create
     * @param password Password for the account
     * 
     * @returns Promise for a boolean with true on success
     */
    createAccount = async (accountName:string, password:string):Promise<boolean> => {
        let params = {
            "accountName": accountName,
            "password": password
        };
        return this.callMethod("keystore.createAccount", params).then((response:RequestResponseData) => {
            return response.data["result"]["success"];
        });
    }

    /**
     * Creates an address (and associated private keys) on an account under a subnet.
     * 
     * @param accountName Name of the account to create the address under
     * @param password Password to unlock the account and encrypt the private key
     * @param subnetAlias The subnetID or subnetAlias which the address is created under
     * 
     * @returns Promise for a string representing the address created by the subnet.
     */
    createAddress = async (accountName:string, password:string, subnetAlias:string):Promise<string> => {
        let params = {
            "accountName": accountName,
            "password": password,
            "subnetAlias": subnetAlias
        };
        return this.callMethod("keystore.createAddress", params).then((response:RequestResponseData) => {
            return response.data["result"]["address"];
        });
    }

    /**
     * Exports and account, returning a string with the AVA Keystore File (AKF).
     * 
     * @param accountName The name of the account to export
     * @param password Not just anyone can export an account... you must have the password
     * 
     * @returns Promise with a string representing the AVA Keystore File (AKF)
     */
    exportAccount = async (accountName:string, password:string):Promise<string> => {
        let params = {
            "accountName": accountName,
            "password": password
        };
        return this.callMethod("keystore.exportAccount", params).then((response:RequestResponseData) => {
            return response.data["result"]["accountData"];
        });
    }

    /**
     * Exports the private key for an address.
     * 
     * @param accountName The name of the account with the private key
     * @param password The password used to decrypt the private key
     * @param subnetAlias The subnetID or subnetAlias that the key exists under
     * @param address The address whose private key should be exported
     * 
     * @returns Promise with the decrypted private key as store in the database
     */
    exportKey = async (accountName:string, password:string, subnetAlias:string, address:string):Promise<string> => {
        let params = {
            "accountName": accountName,
            "password": password,
            "subnetAlias": subnetAlias,
            "address": address
        };
        return this.callMethod("keystore.exportKey", params).then((response:RequestResponseData) => {
            return response.data["result"]["privateKey"];
        });
    }

    /**
     * Gets the balances for all assets on the provided address on the provided subnet.
     * 
     * @param subnetAlias The subnetID or subnetAlias that the address exists under
     * @param address The address to pull the asset balances from
     * 
     * @returns Promise with the key-value pair of assetID to balance.
     */
    getAllBalances = async (subnetAlias:string, address:string):Promise<object> => {
        let params = {
            "subnetAlias": subnetAlias,
            "address": address
        };
        return this.callMethod("keystore.getAllBalances", params).then((response:RequestResponseData) => {
            return response.data["result"]["balances"];
        });
    }

    /**
     * Gets the balance of a particular asset on a subnet.
     * 
     * @param subnetAlias The subnetID or subnetAlias that the address exists under
     * @param address The address to pull the asset balance from
     * @param assetID The assetID to pull the balance from
     * 
     * @returns Promise with the balance of the assetID on the provided address for the subnet.
     */
    getBalance = async (subnetAlias:string, address:string, assetID:string):Promise<number> => {
        let params = {
            "subnetAlias": subnetAlias,
            "address": address, 
            "assetID": assetID
        };
        return this.callMethod("keystore.getBalance", params).then((response:RequestResponseData) => {
            return response.data["result"]["balance"];
        });
    }

    /**
     * @ignore
     */
    getTxHistory =  async (subnetAlias:string, address:string):Promise<object> => {
        let params = {
            "subnetAlias": subnetAlias,
            "address": address
        };
        return this.callMethod("keystore.getTxHistory", params).then((response:RequestResponseData) => {
            return response.data["result"];
        });
    }

    /**
     * Imports an account file into the node's account database and assigns it to an account name.
     * 
     * @param accountName The name the account file should be imported into
     * @param accountData The JSON in the AVA Keystore File (AKF) format
     * @param password The password that's used to encode the private keys in the AKF
     * 
     * @returns A promise with a true-value on success.
     */
    importAccount = async (accountName:string, accountData:string, password:string):Promise<boolean> => {
        let params = {
            "accountName": accountName,
            "accountData": accountData,
            "password": password
        };
        return this.callMethod("keystore.importAccount", params).then((response:RequestResponseData) => {
            return response.data["result"]["success"];
        });
    }

    /**
     * Imports a private key into the node's database under an account and for a subnet.
     * 
     * @param accountName The name of the account to store the private key
     * @param password The password that unlocks the account
     * @param subnetAlias The subnetID or subnetAlias to insert the private key
     * @param privateKey A string representing the private key in the subnet's format
     * 
     * @returns The address for the imported private key.
     */
    importKey = async (accountName:string, password:string, subnetAlias:string, privateKey:string):Promise<string> => {
        let params = {
            "accountName": accountName,
            "password": password,
            "subnetAlias": subnetAlias,
            "privateKey": privateKey
        };
        return this.callMethod("keystore.importKey", params).then((response:RequestResponseData) => {
            return response.data["result"]["address"];
        });
    }

    /**
     * Lists the names of all accounts on the node.
     * 
     * @returns Promise of an array with all account names.
     */
    listAccounts = async ():Promise<Array<string>> => {
        return this.callMethod("keystore.listAccounts").then((response:RequestResponseData) => {
            return response.data["result"]["accounts"];
        });
    }

    /**
     * Lists all the addresses under a subnet on an account.
     * 
     * @param accountName The account to list addresses for
     * @param subnetAlias The subnet to list the addreses for
     * 
     * @returns Promise of an array of address strings in the format specified by the subnet.
     */
    listAddresses = async (accountName:string, subnetAlias:string): Promise<Array<string>> => {
        let params = {
            "accountName": accountName,
            "subnetAlias": subnetAlias
        };
        return this.callMethod("keystore.listAddresses", params).then((response:RequestResponseData) => {
            return response.data["result"]["addresses"];
        });
    }

    /**
     * Lists all assets for a subnet on an address.
     * 
     * @param subnetAlias The subnetID or subnetAlias the address is on
     * @param address The address to get a list of assets for
     * 
     * @returns Promise of an array of assetIDs for the address on the subnet.
     */
    listAssets = async (subnetAlias:string, address:string):Promise<Array<string>> => {
        let params = {
            "subnetAlias": subnetAlias,
            "address": address
        };
        return this.callMethod("keystore.listAssets", params).then((response:RequestResponseData) => {
            return response.data["result"]["assets"];
        });
    }

    /**
     * A list of all subnets supported by the wallet.
     * 
     * @returns An array of subnetIDs which the wallet supports.
     */
    listSubnets = async ():Promise<Array<string>> => {
        return this.callMethod("keystore.listSubnets").then((response:RequestResponseData) => {
            return response.data["result"]["subnetIDs"];
        });
    }

    /**
     * Sends an amount of assetID to the specified address from a list of owned of addresses.
     * 
     * @param accountName The account that owns the private keys associated with the `from` addresses
     * @param password The password unlocking the account
     * @param subnetAlias The subnetID or subnetAlias the asset resides on
     * @param assetID The assetID of the asset to send
     * @param amount The amount of the asset to be sent
     * @param to The address of the recipient
     * @param from An array of addresses managed by the node for this subnet which will fund this transaction
     * 
     * @returns Promise for the string representing the transaction's ID.
     */
    send = async (accountName:string, password:string, subnetAlias:string, assetID:string, amount:number, to:string, from:Array<string>):Promise<string> => {
        let params = {
            "accountName": accountName,
            "password": password,
            "subnetAlias": subnetAlias,
            "assetID": assetID,
            "amount": amount,
            "to": to, 
            "from": from
        };
        return this.callMethod("keystore.send", params).then((response:RequestResponseData) => {
            return response.data["result"]["txID"];
        });
    }

    /**
     * This class should not be instantiated directly. Instead use the [[Slopes.addAPI]] method.
     * 
     * @param core A reference to the Slopes class
     * @param baseurl Defaults to the string "/ext/keystore" as the path to subnets baseurl
     */
    constructor(core:SlopesCore, baseurl:string = "/ext/keystore"){ super(core, baseurl); }
}

export default KeystoreAPI;