/**
 * @packageDocumentation
 * @module Common-JRPCAPI
 */

import { AxiosRequestConfig } from "axios"
import { fetchAdapter } from "../utils"
import AvalancheCore from "../avalanche"
import { APIBase, RequestResponseData } from "./apibase"

export class JRPCAPI extends APIBase {
  protected jrpcVersion: string = "2.0"
  protected rpcID = 1

  callMethod = async (
    method: string,
    params?: object[] | object,
    baseURL?: string,
    headers?: object
  ): Promise<RequestResponseData> => {
    const ep: string = baseURL || this.baseURL
    const rpc: any = {}
    rpc.id = this.rpcID
    rpc.method = method

    // Set parameters if exists
    if (params) {
      rpc.params = params
    } else if (this.jrpcVersion === "1.0") {
      rpc.params = []
    }

    if (this.jrpcVersion !== "1.0") {
      rpc.jsonrpc = this.jrpcVersion
    }

    let headrs: object = { "Content-Type": "application/json;charset=UTF-8" }
    if (headers) {
      headrs = { ...headrs, ...headers }
    }

    baseURL = this.core.getURL()

    const axConf: AxiosRequestConfig = {
      baseURL: baseURL,
      responseType: "json",
      // use the fetch adapter if fetch is available e.g. non Node<17 env
      adapter: typeof fetch !== "undefined" ? fetchAdapter : undefined
    }

    const resp: RequestResponseData = await this.core.post(
      ep,
      {},
      JSON.stringify(rpc),
      headrs,
      axConf
    )
    if (resp.status >= 200 && resp.status < 300) {
      this.rpcID += 1
      if (typeof resp.data === "string") {
        resp.data = JSON.parse(resp.data)
      }
      if (
        typeof resp.data === "object" &&
        (resp.data === null || "error" in resp.data)
      ) {
        throw new Error(resp.data.error.message)
      }
    }
    return resp
  }

  /**
   * Returns the rpcid, a strictly-increasing number, starting from 1, indicating the next
   * request ID that will be sent.
   */
  getRPCID = (): number => this.rpcID

  /**
   *
   * @param core Reference to the Avalanche instance using this endpoint
   * @param baseURL Path of the APIs baseURL - ex: "/ext/bc/avm"
   * @param jrpcVersion The jrpc version to use, default "2.0".
   */
  constructor(
    core: AvalancheCore,
    baseURL: string,
    jrpcVersion: string = "2.0"
  ) {
    super(core, baseURL)
    this.jrpcVersion = jrpcVersion
    this.rpcID = 1
  }
}
