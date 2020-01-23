/**
 * @module Slopes
 */
import AVACore from './slopes';
import KeystoreAPI from './apis/keystore/api';
import PlatformAPI from './apis/platform/api';
import AVMAPI from './apis/avm/api';
import AdminAPI from './apis/admin/api';

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

