/**
 * @packageDocumentation
 * @module API-Socket
 */
import WebSocket from "isomorphic-ws";
/**
 * Class for interacting with a node"s InfoAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
export class Socket extends WebSocket {
  onopen;
  onmessage;
  onclose;
  onerror;
  send(data: any, cb?): void {
    super.send(data, cb);
  }
  close(mcode?: number, data?: string): void {
    super.close(mcode, data);
  }
  constructor(baseurl: string = "wss://api.avax.network:443/ext/bc/X/events") { 
    super(baseurl);
  }
}
