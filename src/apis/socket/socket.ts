/**
 * @packageDocumentation
 * @module API-Socket
 */
import { ClientRequestArgs } from "http";
import WebSocket from "isomorphic-ws";
import { MainnetAPI } from "src/utils";
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

  constructor(
    address: string | import("url").URL = `wss://${MainnetAPI}:443/ext/bc/X/events`, 
    options?: WebSocket.ClientOptions | ClientRequestArgs) { 
    super(address, options);
  }
}
