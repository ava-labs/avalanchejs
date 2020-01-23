/**
 * @module Slopes
 */
import AVACore from './slopes';
import KeystoreAPI from './apis/keystore/api';
import PlatformAPI from './apis/platform/api';
import AVMAPI from './apis/avm/api';
import AdminAPI from './apis/admin/api';
import * as CoreTypes from './utils/types';
import BinTools from './utils/bintools';
import DB from './utils/db';

import * as AVAAPITxAPI from './apis/avm/tx';	
import * as AVAAPIUTXOAPI from './apis/avm/utxos';	
import * as AVAAPITypes from './apis/avm/types';	
import * as AVAAPIOutputs from './apis/avm/outputs';	
import * as AVAAPIInput from './apis/avm/inputs';	
import * as AVAAPIKeyChain from './apis/avm/keychain';

/**
 * Slopes is middleware for interacting with AVA node RPC APIs. 
 * 
 * Example usage:
 * ```js
 * let ava = new Slopes("127.0.0.1", 9650, "https");
 * ```
 * 
 */
export default class Slopes extends AVACore {

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

class CoreTypesHolder {	
    RequestResponseData = CoreTypes.RequestResponseData;	
    API = CoreTypes.API;	
    JRPCAPI = CoreTypes.JRPCAPI;	
    constructor() {}	
}	

class AVMInputHolder {	
    Input = AVAAPIInput.Input;	
    constructor() {}	
}	

class AVMKeychainHolder {	
    AVAKeyPair = AVAAPIKeyChain.AVMKeyPair;	
    AVAKeyChain = AVAAPIKeyChain.AVMKeyChain;	
    constructor() {}	
}	

class AVMOutputHolder {	
    Output = AVAAPIOutputs.Output;	
    OutPayment = AVAAPIOutputs.OutPayment;	
    OutTakeOrLeave = AVAAPIOutputs.OutTakeOrLeave;	
    constructor() {}	
}	

class AVMTxAPIHolder {	
    Tx = AVAAPITxAPI.Tx;	
    TxUnsigned = AVAAPITxAPI.TxUnsigned;	
    constructor() {}	
}	

class AVMTypesHolder {	
    Address = AVAAPITypes.Address;	
    Signature = AVAAPITypes.Signature;	
    SigIdx = AVAAPITypes.SigIdx;	
    constructor() {}	
}	

class AVMUTXOHolder {	
    UTXO = AVAAPIUTXOAPI.UTXO;	
    UTXOSet = AVAAPIUTXOAPI.UTXOSet;	
    constructor() {}	
}	

class APIMiddleware<GE extends CoreTypes.API> {	
    API: new(ava:AVACore) => GE;	
    constructor(constructorFN: new(ava:AVACore) => GE){	
        this.API = constructorFN;	
    }	
}	

class AdminMiddleware extends APIMiddleware<AdminAPI> {	
    constructor(){	
        super(AdminAPI);	
    }	
};	
class AVMMiddleware extends APIMiddleware<AVMAPI> {	
    Ins:AVMInputHolder = new AVMInputHolder();	
    Keychain:AVMKeychainHolder = new AVMKeychainHolder();	
    Outs:AVMOutputHolder = new AVMOutputHolder();	
    Tx:AVMTxAPIHolder = new AVMTxAPIHolder();	
    Types:AVMTypesHolder = new AVMTypesHolder();	
    UTXO:AVMUTXOHolder = new AVMUTXOHolder();	
    constructor(){	
        super(AVMAPI);	
    }	
};	
class PlatformMiddleware extends APIMiddleware<PlatformAPI> {	
    constructor(){	
        super(PlatformAPI);	
    }	
};	
class KeystoreAPIMiddleware extends APIMiddleware<KeystoreAPI> {	
    constructor(){	
        super(KeystoreAPI);	
    }	
};	

/**	
 * TypesLib contains references to all the classes and types used in this middleware.	
 * The constructor for the API class is listed in the API variable. 	
 * In most situations it does not make sense to go through these classes directly.	
 * 	
 * Example:	
 * ```js	
 * let Keystore = TypesLibrary.KeystoreAPI.API;	
 * let AVMKeyChain = TypesLibrary.AVMAPI.KeyChain;	
 * let AVMUTXOSet = TypesLibrary.AVMAPI.UTXO.UTXOSet;	
 * ```	
 */	
class TypesLib {	
    /**	
     * Reference to the AdminAPI classes.	
     */	
    AdminAPI:AdminMiddleware = new AdminMiddleware();	
    /**	
     * Reference to the AVMAPI classes.	
     */	
    AVMAPI:AVMMiddleware = new AVMMiddleware();	
    /**	
     * Reference to the PlatformAPI classes.	
     */	
    PlatformAPI:PlatformMiddleware = new PlatformMiddleware();	
    /**	
     * Reference to the KeystoreAPI classes.	
     */	
    KeystoreAPI:KeystoreAPIMiddleware = new KeystoreAPIMiddleware();	
    /**	
     * Reference to the DB classes.	
     */	
    DB:DB = DB.getInstance();	
    /**	
     * Reference to the BinTools singleton.	
     */	
    BinTools:BinTools = BinTools.getInstance();	
    /**	
     * Reference to the AVAJS core's types.	
     */	
    CoreTypes:CoreTypesHolder = new CoreTypesHolder();	

    /**	
     * Returns instance of [[TypesLib]].	
     */	
    constructor() {}	
}	

const TypesLibrary:TypesLib = new TypesLib();	
export {TypesLibrary} 