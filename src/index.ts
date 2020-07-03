/**
 * @packageDocumentation
 * @module Avalanche
 */
import AvalancheCore from './avalanche';
import AdminAPI from './apis/admin/api';
import AVMAPI from './apis/avm/api';
import HealthAPI from "./apis/health/api";
import InfoAPI from './apis/info/api';
import KeystoreAPI from './apis/keystore/api';
import MetricsAPI from './apis/metrics/api';
import PlatformAPI from './apis/platform/api';
import * as CoreTypes from './utils/types';
import BinTools from './utils/bintools';
import DB from './utils/db';
import { Defaults } from './utils/types';

/**
 * Avalanche.js is middleware for interacting with AVA node RPC APIs. 
 * 
 * Example usage:
 * ```js
 * let avalanche = new Avalanche("127.0.0.1", 9650, "https");
 * ```
 * 
 */
export class Avalanche extends AvalancheCore {

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
     * Returns a reference to the Health RPC for a node.
     */
    Health = () => {
        return this.apis["health"] as HealthAPI;
    }

    /**
     * Returns a reference to the Info RPC for a node.
     */
    Info = () => {
        return this.apis["info"] as InfoAPI;
    }

    /**
     * Returns a reference to the Metrics RPC.
     */
    Metrics = () => {
        return this.apis["metrics"] as MetricsAPI;
    }

    /**
     * Returns a reference to the Keystore RPC for a node. We label it "NodeKeys" to reduce confusion about what it's accessing.
     */
    NodeKeys = () => {
        return this.apis["keystore"] as KeystoreAPI;
    }

    /**
     * Returns a reference to the Platform RPC.
     */
    Platform = () => {
        return this.apis["platform"] as PlatformAPI;
    }

    /**
     * Creates a new AVA instance. Sets the address and port of the main AVA Client.
     * 
     * @param ip The hostname to resolve to reach the AVA Client RPC APIs
     * @param port The port to resolve to reach the AVA Client RPC APIs
     * @param protocol The protocol string to use before a "://" in a request, ex: "http", "https", "git", "ws", etc ...
     * @param networkid Sets the NetworkID of the class. Default 3
     * @param avmChainID Sets the blockchainID for the AVM. Will try to auto-detect, otherwise default "4R5p2RXDGLqaifZE4hHWH9owe34pfoBULn1DrQTWivjg8o4aH"
     * @param skipinit Skips creating the APIs
     */
    constructor(ip:string, port:number, protocol:string = "http", networkID:number = 3, avmChainID:string = undefined, skipinit:boolean = false) {
        super(ip, port, protocol);
        let chainid = avmChainID;
        if(typeof avmChainID === 'undefined' || !avmChainID || avmChainID.toLowerCase() == "avm" || avmChainID.toLowerCase() == "x"){
            if(networkID.toString() in Defaults.network){
                chainid = Defaults.network[networkID]["X"].blockchainID
            } else {
                chainid = "4R5p2RXDGLqaifZE4hHWH9owe34pfoBULn1DrQTWivjg8o4aH";
            }
        }
        if(typeof networkID === 'number' && networkID >= 0){
            this.networkID = networkID;
        }
        if(!skipinit){
            this.addAPI("admin", AdminAPI);
            this.addAPI("avm", AVMAPI, "/ext/bc/X", chainid);
            this.addAPI('health', HealthAPI);
            this.addAPI('info', InfoAPI);
            this.addAPI("keystore", KeystoreAPI);
            this.addAPI("metrics", MetricsAPI);
            this.addAPI("platform", PlatformAPI);
        }
    }
}

export {BinTools};
export {DB};
export {CoreTypes};
export {AvalancheCore};

export * from './avalanche';
export * from './apis/keystore/api';
export * from './apis/platform/api';
export * from './apis/avm/api';
export * from './apis/admin/api';
export * from './utils/types';
export * from './utils/bintools';
export * from './utils/db';
export * from './utils/crypto';

export {SelectCredentialClass, Credential, SecpCredential, NFTCredential} from './apis/avm/credentials';
export {SelectInputClass, Input, TransferableInput, AmountInput, SecpInput} from './apis/avm/inputs';
export {AVMKeyPair, AVMKeyChain} from './apis/avm/keychain';
export {SelectOperationClass,Operation, TransferableOperation, NFTTransferOperation} from  './apis/avm/ops';
export {SelectOutputClass, Output, TransferableOutput, AmountOutput, SecpOutput, NFTOutBase, NFTTransferOutput} from './apis/avm/outputs';
export {BaseTx, CreateAssetTx, OperationTx, UnsignedTx, Tx} from './apis/avm/tx';
export {SigIdx, Signature, Address, UTXOID, InitialStates, AVMConstants, MergeRule, UnixNow} from './apis/avm/types';
export {UTXO, UTXOSet} from './apis/avm/utxos';	

export {AdminAPI as Admin};
export {AVMAPI as AVM};
export {HealthAPI as Health};
export {InfoAPI as Info};
export {KeystoreAPI as Keystore};
export {MetricsAPI as Metrics};
export {PlatformAPI as Platform};
