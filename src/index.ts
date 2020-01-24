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

import * as AVMAPITxAPI from './apis/avm/tx';	
import * as AVMAPIUTXOAPI from './apis/avm/utxos';	
import * as AVMAPITypes from './apis/avm/types';	
import * as AVMAPIOutputs from './apis/avm/outputs';	
import * as AVMAPIInput from './apis/avm/inputs';	
import * as AVMAPIKeyChain from './apis/avm/keychain';
import { PersistanceOptions } from './apis/avm/api';

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
    API = CoreTypes.APIBase;	
    JRPCAPI = CoreTypes.JRPCAPI;	
    constructor() {}	
}	

class AVMInputHolder {	
    Input = AVMAPIInput.Input;	
    constructor() {}	
}	

class AVMKeysHolder {	
    AVMKeyPair = AVMAPIKeyChain.AVMKeyPair;	
    AVMKeyChain = AVMAPIKeyChain.AVMKeyChain;	
    constructor() {}	
}	

class AVMOutputHolder {	
    Output = AVMAPIOutputs.Output;	
    OutPayment = AVMAPIOutputs.OutPayment;	
    OutTakeOrLeave = AVMAPIOutputs.OutTakeOrLeave;
    OutCreateAsset = AVMAPIOutputs.OutCreateAsset;	
    constructor() {}	
}	

class AVMTxAPIHolder {	
    Tx = AVMAPITxAPI.Tx;	
    TxUnsigned = AVMAPITxAPI.TxUnsigned;	
    constructor() {}	
}	

class AVMTypesHolder {	
    Address = AVMAPITypes.Address;	
    Signature = AVMAPITypes.Signature;	
    SigIdx = AVMAPITypes.SigIdx;
    UnixNow = AVMAPITypes.UnixNow;
    constructor() {}	
}	

class AVMUTXOHolder {	
    UTXO = AVMAPIUTXOAPI.UTXO;	
    UTXOSet = AVMAPIUTXOAPI.UTXOSet;	
    constructor() {}	
}	

class APIMiddleware<GE extends CoreTypes.APIBase> {	
    API: new(core:SlopesCore) => GE;	
    constructor(constructorFN: new(core:SlopesCore) => GE){	
        this.API = constructorFN;	
    }	
}	

class AdminMiddleware extends APIMiddleware<AdminAPI> {	
    constructor(){	
        super(AdminAPI);	
    }	
};	
class AVMMiddleware extends APIMiddleware<AVMAPI> {	
    Inputs:AVMInputHolder = new AVMInputHolder();	
    Keys:AVMKeysHolder = new AVMKeysHolder();	
    Outputs:AVMOutputHolder = new AVMOutputHolder();	
    Txs:AVMTxAPIHolder = new AVMTxAPIHolder();	
    Types:AVMTypesHolder = new AVMTypesHolder();	
    UTXOs:AVMUTXOHolder = new AVMUTXOHolder();
    PersistanceOpts = PersistanceOptions;
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
 * let AVMKeyChain = TypesLibrary.AVM.KeyChain;	
 * let AVMUTXOSet = TypesLibrary.AVM.UTXOs.UTXOSet;	
 * ```	
 */	
class TypesLib {	
    /**	
     * Reference to the AdminAPI classes.	
     */	
    Admin:AdminMiddleware = new AdminMiddleware();	
    /**	
     * Reference to the AVMAPI classes.	
     */	
    AVM:AVMMiddleware = new AVMMiddleware();	
    /**	
     * Reference to the PlatformAPI classes.	
     */	
    Platform:PlatformMiddleware = new PlatformMiddleware();	
    /**	
     * Reference to the KeystoreAPI classes.	
     */	
    Keystore:KeystoreAPIMiddleware = new KeystoreAPIMiddleware();	
    /**	
     * Reference to the DB classes.	
     */	
    DB:DB = DB.getInstance();	
    /**	
     * Reference to the BinTools singleton.	
     */	
    BinTools:BinTools = BinTools.getInstance();	
    /**	
     * Reference to the Slopes core's types.	
     */	
    CoreTypes:CoreTypesHolder = new CoreTypesHolder();	

    /**	
     * Returns instance of [[TypesLib]].	
     */	
    constructor() {}	
}	

const TypesLibrary:TypesLib = new TypesLib();	
export {TypesLibrary};

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


