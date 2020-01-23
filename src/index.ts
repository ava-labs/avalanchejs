/**
 * @module Slopes
 */
import AVACore from './slopes';
import KeystoreAPI from './apis/keystore/api';
import PlatformAPI from './apis/platform/api';
import AdminAPI from './apis/admin/api';
import AVMAPI from './apis/avm/api';
import * as AVMUTXOs from './apis/avm/utxos';
import * as AVMTypes from './apis/avm/types';
import * as AVMTxs from './apis/avm/tx';
import * as AVMOutputs from './apis/avm/outputs';
import * as AVMKeychain from './apis/avm/keychain';
import * as AVMInputs from './apis/avm/inputs';
import * as CoreTypes from './utils/types';
import BinTools from './utils/bintools';
import DB from './utils/db';


/**
 * Slopes is middleware for interacting with AVA node RPC APIs. 
 * 
 * Example usage:
 * ```js
 * let ava = new Slopes("127.0.0.1", 9650, "https");
 * ```
 * 
 */
class Slopes extends AVACore {

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
     */
    constructor(ip:string, port:number, protocol:string = "http") {
        super(ip, port, protocol);
        this.addAPI("admin", AdminAPI);
        this.addAPI("avm", AVMAPI);
        this.addAPI("platform", PlatformAPI);
        this.addAPI("keystore", KeystoreAPI);
    }
}

declare namespace AVM {
    export {
        AVMUTXOs as UTXOs,
        AVMTypes as Types,
        AVMTxs as Txs,
        AVMOutputs as Outputs,
        AVMKeychain as Keychain, 
        AVMInputs as Inputs,
        AVMAPI as API
    };
}

declare namespace Keystore {
    export {
        KeystoreAPI as API
    }
}

declare namespace Platform {
    export {
        PlatformAPI as API
    }
}

declare namespace Admin {
    export {
        AdminAPI as API
    }
}

declare namespace slopes {
    export {Slopes, BinTools, CoreTypes, DB, Admin, AVACore, AVM, Keystore, Platform}; 
}

export default slopes;

/*
const slopes = {
    Slopes:Slopes,
    AVM: {
        UTXOs,
        Types,
        Txs,
        Outputs,
        Keychain, 
        Inputs,
        AVMAPI
    }
}

export default slopes;*/