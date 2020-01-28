/**
 * @module Slopes
 */
import SlopesCore from './slopes';
import KeystoreAPI from './apis/keystore/api';
import PlatformAPI from './apis/platform/api';
import AVMAPI from './apis/avm/api';
import AdminAPI from './apis/admin/api';
import * as CoreTypes from './utils/types';
import BinTools from './utils/bintools';
import DB from './utils/db';

/**
 * Slopes is middleware for interacting with AVA node RPC APIs. 
 * 
 * Example usage:
 * ```js
 * let slopes = new Slopes("127.0.0.1", 9650, "https");
 * ```
 * 
 */
export class Slopes extends SlopesCore {

    /**
     * Returns a reference to the Admin RPC.
     */
    Admin = () => {
        return this.apis["admin"] as AdminAPI;
    }

    /**
     * Returns a reference to the AVM RPC.
     */
    AVM = () => {
        return this.apis["avm"] as AVMAPI;
    }

    /**
     * Returns a reference to the Platform RPC.
     */
    Platform = () => {
        return this.apis["platform"] as PlatformAPI;
    }

    /**
     * Returns a reference to the Keystore RPC for a node. We label it "NodeKeys" to reduce confusion about what it's accessing.
     */
    NodeKeys = () => {
        return this.apis["keystore"] as KeystoreAPI;
    }

    /**
     * Creates a new AVA instance. Sets the address and port of the main AVA Client.
     * 
     * @param ip The hostname to resolve to reach the AVA Client RPC APIs
     * @param port The port to reolve to reach the AVA Client RPC APIs
     * @param protocol The protocol string to use before a "://" in a request, ex: "http", "https", "git", "ws", etc ...
     * @param networkid Sets the NetworkID of the class instead of reaching out to the Admin API
     * @param skipinit Skips creating the APIs
     */
    constructor(ip:string, port:number, protocol:string = "http", networkid:number = undefined, skipinit:boolean = false) {
        super(ip, port, protocol);
        if(typeof networkid === 'number' && networkid >= 0){
            this.networkID = networkid;
        }
        if(!skipinit){
            this.addAPI("admin", AdminAPI);
            if(typeof networkid !== 'number'){
                (this.apis["admin"] as AdminAPI).getNetworkID().then((netid:number) => {
                    this.networkID = netid;
                }).catch((err) => {
                    throw err; // completes the promise chain, I believe
                });;
            }
            (this.apis["admin"] as AdminAPI).getBlockchainID("avm").then((blockchainid:string) => {
                this.addAPI("avm", AVMAPI, "/ext/subnet/avm", blockchainid);
            }).catch((err) => {
                throw err; // completes the promise chain, I believe
            });
            this.addAPI("platform", PlatformAPI);
            this.addAPI("keystore", KeystoreAPI);
        }
    }
}

export {BinTools};
export {DB};
export {CoreTypes};
export {SlopesCore};

export * from './slopes';
export * from './apis/keystore/api';
export * from './apis/platform/api';
export * from './apis/avm/api';
export * from './apis/admin/api';
export * from './utils/types';
export * from './utils/bintools';
export * from './utils/db';

export {Tx, TxUnsigned} from './apis/avm/tx';
export {UTXO, UTXOSet} from './apis/avm/utxos';	
export {SigIdx, Signature, UnixNow, Address} from './apis/avm/types';	
export {OutCreateAsset, OutPayment, OutTakeOrLeave, Output, SelectOutputClass} from './apis/avm/outputs';	
export {Input} from './apis/avm/inputs';	
export {AVMKeyPair, AVMKeyChain} from './apis/avm/keychain';

export {AVMAPI as AVM};
export {KeystoreAPI as Keystore};
export {PlatformAPI as Platform};
export {AdminAPI as Admin};


