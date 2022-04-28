/**
 * @packageDocumentation
 * @module Common-RESTAPI
 */

import { AxiosRequestConfig } from "axios"
import AvalancheCore from "../avalanche"
import { APIBase, RequestResponseData } from "./apibase"

export class RESTAPI extends APIBase {
  protected contentType: string
  protected acceptType: string

  protected prepHeaders = (
    contentType?: string,
    acceptType?: string
  ): object => {
    const headers: object = {}
    if (contentType !== undefined) {
      headers["Content-Type"] = contentType
    } else {
      headers["Content-Type"] = this.contentType
    }

    if (acceptType !== undefined) {
      headers["Accept"] = acceptType
    } else if (this.acceptType !== undefined) {
      headers["Accept"] = this.acceptType
    }
    return headers
  }

  protected axConf = (): AxiosRequestConfig => {
    return {
      baseURL: this.core.getURL(),
      responseType: "json"
    }
  }

  get = async (
    baseURL?: string,
    contentType?: string,
    acceptType?: string
  ): Promise<RequestResponseData> => {
    const ep: string = baseURL || this.baseURL
    const headers: object = this.prepHeaders(contentType, acceptType)
    const resp: RequestResponseData = await this.core.get(
      ep,
      {},
      headers,
      this.axConf()
    )
    return resp
  }

  post = async (
    method: string,
    params?: object[] | object,
    baseURL?: string,
    contentType?: string,
    acceptType?: string
  ): Promise<RequestResponseData> => {
    const ep: string = baseURL || this.baseURL
    const rpc: any = {}
    rpc.method = method

    // Set parameters if exists
    if (params) {
      rpc.params = params
    }

    const headers: object = this.prepHeaders(contentType, acceptType)
    const resp: RequestResponseData = await this.core.post(
      ep,
      {},
      JSON.stringify(rpc),
      headers,
      this.axConf()
    )
    return resp
  }

  put = async (
    method: string,
    params?: object[] | object,
    baseURL?: string,
    contentType?: string,
    acceptType?: string
  ): Promise<RequestResponseData> => {
    const ep: string = baseURL || this.baseURL
    const rpc: any = {}
    rpc.method = method

    // Set parameters if exists
    if (params) {
      rpc.params = params
    }

    const headers: object = this.prepHeaders(contentType, acceptType)
    const resp: RequestResponseData = await this.core.put(
      ep,
      {},
      JSON.stringify(rpc),
      headers,
      this.axConf()
    )
    return resp
  }

  delete = async (
    method: string,
    params?: object[] | object,
    baseURL?: string,
    contentType?: string,
    acceptType?: string
  ): Promise<RequestResponseData> => {
    const ep: string = baseURL || this.baseURL
    const rpc: any = {}
    rpc.method = method

    // Set parameters if exists
    if (params) {
      rpc.params = params
    }

    const headers: object = this.prepHeaders(contentType, acceptType)
    const resp: RequestResponseData = await this.core.delete(
      ep,
      {},
      headers,
      this.axConf()
    )
    return resp
  }

  patch = async (
    method: string,
    params?: object[] | object,
    baseURL?: string,
    contentType?: string,
    acceptType?: string
  ): Promise<RequestResponseData> => {
    const ep: string = baseURL || this.baseURL
    const rpc: any = {}
    rpc.method = method

    // Set parameters if exists
    if (params) {
      rpc.params = params
    }

    const headers: object = this.prepHeaders(contentType, acceptType)
    const resp: RequestResponseData = await this.core.patch(
      ep,
      {},
      JSON.stringify(rpc),
      headers,
      this.axConf()
    )
    return resp
  }

  /**
   * Returns the type of the entity attached to the incoming request
   */
  getContentType = (): string => this.contentType

  /**
   * Returns what type of representation is desired at the client side
   */
  getAcceptType = (): string => this.acceptType

  /**
   *
   * @param core Reference to the Avalanche instance using this endpoint
   * @param baseURL Path of the APIs baseURL - ex: "/ext/bc/avm"
   * @param contentType Optional Determines the type of the entity attached to the
   * incoming request
   * @param acceptType Optional Determines the type of representation which is
   * desired on the client side
   */
  constructor(
    core: AvalancheCore,
    baseURL: string,
    contentType: string = "application/json;charset=UTF-8",
    acceptType: string = undefined
  ) {
    super(core, baseURL)
    this.contentType = contentType
    this.acceptType = acceptType
  }
}
