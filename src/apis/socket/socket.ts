/**
 * @packageDocumentation
 * @module API-Socket
 */
import { ClientRequestArgs } from "http"
import WebSocket from "isomorphic-ws"
import { MainnetAPI } from "../../utils"
export class Socket extends WebSocket {
  // Fires once the connection has been established between the client and the server
  onopen: any
  // Fires when the server sends some data
  onmessage: any
  // Fires after end of the communication between server and the client
  onclose: any
  // Fires for some mistake, which happens during the communication
  onerror: any

  /**
   * Send a message to the server
   *
   * @param data
   * @param cb Optional
   */
  send(data: any, cb?: any): void {
    super.send(data, cb)
  }

  /**
   * Terminates the connection completely
   *
   * @param mcode Optional
   * @param data Optional
   */
  close(mcode?: number, data?: string): void {
    super.close(mcode, data)
  }

  /**
   * Provides the API for creating and managing a WebSocket connection to a server, as well as for sending and receiving data on the connection.
   *
   * @param url Defaults to [[MainnetAPI]]
   * @param options Optional
   */
  constructor(
    url: string | import("url").URL = `wss://${MainnetAPI}:443/ext/bc/X/events`,
    options?: WebSocket.ClientOptions | ClientRequestArgs
  ) {
    super(url, options)
  }
}
