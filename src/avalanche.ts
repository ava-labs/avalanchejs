/**
 * @packageDocumentation
 * @module AvalancheCore
 */
import axios, {
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponse,
  Method
} from "axios"
import { APIBase, RequestResponseData } from "./common/apibase"
import { ProtocolError } from "./utils/errors"
import { fetchAdapter } from "./utils/fetchadapter"
import { getPreferredHRP } from "./utils/helperfunctions"

/**
 * AvalancheCore is middleware for interacting with Avalanche node RPC APIs.
 *
 * Example usage:
 * ```js
 * let avalanche = new AvalancheCore("127.0.0.1", 9650, "https")
 * ```
 *
 *
 */
export default class AvalancheCore {
  protected networkID: number = 0
  protected hrp: string = ""
  protected protocol: string
  protected ip: string
  protected host: string
  protected port: number
  protected baseEndpoint: string
  protected url: string
  protected auth: string = undefined
  protected headers: { [k: string]: string } = {}
  protected requestConfig: AxiosRequestConfig = {}
  protected apis: { [k: string]: APIBase } = {}

  /**
   * Sets the address and port of the main Avalanche Client.
   *
   * @param host The hostname to resolve to reach the Avalanche Client RPC APIs.
   * @param port The port to resolve to reach the Avalanche Client RPC APIs.
   * @param protocol The protocol string to use before a "://" in a request,
   * ex: "http", "https", etc. Defaults to http
   * @param baseEndpoint the base endpoint to reach the Avalanche Client RPC APIs,
   * ex: "/rpc". Defaults to "/"
   * The following special characters are removed from host and protocol
   * &#,@+()$~%'":*?{} also less than and greater than signs
   */
  setAddress = (
    host: string,
    port: number,
    protocol: string = "http",
    baseEndpoint: string = ""
  ): void => {
    host = host.replace(/[&#,@+()$~%'":*?<>{}]/g, "")
    protocol = protocol.replace(/[&#,@+()$~%'":*?<>{}]/g, "")
    const protocols: string[] = ["http", "https"]
    if (!protocols.includes(protocol)) {
      /* istanbul ignore next */
      throw new ProtocolError(
        "Error - AvalancheCore.setAddress: Invalid protocol"
      )
    }

    this.host = host
    this.port = port
    this.protocol = protocol
    this.baseEndpoint = baseEndpoint
    let url: string = `${protocol}://${host}`
    if (port != undefined && typeof port === "number" && port >= 0) {
      url = `${url}:${port}`
    }
    if (
      baseEndpoint != undefined &&
      typeof baseEndpoint == "string" &&
      baseEndpoint.length > 0
    ) {
      if (baseEndpoint[0] != "/") {
        baseEndpoint = `/${baseEndpoint}`
      }
      url = `${url}${baseEndpoint}`
    }
    this.url = url
  }

  /**
   * Returns the protocol such as "http", "https", "git", "ws", etc.
   */
  getProtocol = (): string => this.protocol

  /**
   * Returns the host for the Avalanche node.
   */
  getHost = (): string => this.host

  /**
   * Returns the IP for the Avalanche node.
   */
  getIP = (): string => this.host

  /**
   * Returns the port for the Avalanche node.
   */
  getPort = (): number => this.port

  /**
   * Returns the base endpoint for the Avalanche node.
   */
  getBaseEndpoint = (): string => this.baseEndpoint

  /**
   * Returns the URL of the Avalanche node (ip + port)
   */
  getURL = (): string => this.url

  /**
   * Returns the custom headers
   */
  getHeaders = (): object => this.headers

  /**
   * Returns the custom request config
   */
  getRequestConfig = (): AxiosRequestConfig => this.requestConfig

  /**
   * Returns the networkID
   */
  getNetworkID = (): number => this.networkID

  /**
   * Sets the networkID
   */
  setNetworkID = (netID: number): void => {
    this.networkID = netID
    this.hrp = getPreferredHRP(this.networkID)
  }

  /**
   * Returns the Human-Readable-Part of the network associated with this key.
   *
   * @returns The [[KeyPair]]'s Human-Readable-Part of the network's Bech32 addressing scheme
   */
  getHRP = (): string => this.hrp

  /**
   * Sets the the Human-Readable-Part of the network associated with this key.
   *
   * @param hrp String for the Human-Readable-Part of Bech32 addresses
   */
  setHRP = (hrp: string): void => {
    this.hrp = hrp
  }

  /**
   * Adds a new custom header to be included with all requests.
   *
   * @param key Header name
   * @param value Header value
   */
  setHeader = (key: string, value: string): void => {
    this.headers[`${key}`] = value
  }

  /**
   * Removes a previously added custom header.
   *
   * @param key Header name
   */
  removeHeader = (key: string): void => {
    delete this.headers[`${key}`]
  }

  /**
   * Removes all headers.
   */
  removeAllHeaders = (): void => {
    for (const prop in this.headers) {
      if (Object.prototype.hasOwnProperty.call(this.headers, prop)) {
        delete this.headers[`${prop}`]
      }
    }
  }

  /**
   * Adds a new custom config value to be included with all requests.
   *
   * @param key Config name
   * @param value Config value
   */
  setRequestConfig = (key: string, value: string | boolean): void => {
    this.requestConfig[`${key}`] = value
  }

  /**
   * Removes a previously added request config.
   *
   * @param key Header name
   */
  removeRequestConfig = (key: string): void => {
    delete this.requestConfig[`${key}`]
  }

  /**
   * Removes all request configs.
   */
  removeAllRequestConfigs = (): void => {
    for (const prop in this.requestConfig) {
      if (Object.prototype.hasOwnProperty.call(this.requestConfig, prop)) {
        delete this.requestConfig[`${prop}`]
      }
    }
  }

  /**
   * Sets the temporary auth token used for communicating with the node.
   *
   * @param auth A temporary token provided by the node enabling access to the endpoints on the node.
   */
  setAuthToken = (auth: string): void => {
    this.auth = auth
  }

  protected _setHeaders = (headers: any): AxiosRequestHeaders => {
    if (typeof this.headers === "object") {
      for (const [key, value] of Object.entries(this.headers)) {
        headers[`${key}`] = value
      }
    }

    if (typeof this.auth === "string") {
      headers.Authorization = `Bearer ${this.auth}`
    }
    return headers
  }

  /**
   * Adds an API to the middleware. The API resolves to a registered blockchain's RPC.
   *
   * In TypeScript:
   * ```js
   * avalanche.addAPI<MyVMClass>("mychain", MyVMClass, "/ext/bc/mychain")
   * ```
   *
   * In Javascript:
   * ```js
   * avalanche.addAPI("mychain", MyVMClass, "/ext/bc/mychain")
   * ```
   *
   * @typeparam GA Class of the API being added
   * @param apiName A label for referencing the API in the future
   * @param ConstructorFN A reference to the class which instantiates the API
   * @param baseurl Path to resolve to reach the API
   *
   */
  addAPI = <GA extends APIBase>(
    apiName: string,
    ConstructorFN: new (
      avax: AvalancheCore,
      baseurl?: string,
      ...args: any[]
    ) => GA,
    baseurl: string = undefined,
    ...args: any[]
  ) => {
    if (typeof baseurl === "undefined") {
      this.apis[`${apiName}`] = new ConstructorFN(this, undefined, ...args)
    } else {
      this.apis[`${apiName}`] = new ConstructorFN(this, baseurl, ...args)
    }
  }

  /**
   * Retrieves a reference to an API by its apiName label.
   *
   * @param apiName Name of the API to return
   */
  api = <GA extends APIBase>(apiName: string): GA =>
    this.apis[`${apiName}`] as GA

  /**
   * @ignore
   */
  protected _request = async (
    xhrmethod: Method,
    baseurl: string,
    getdata: object,
    postdata: string | object | ArrayBuffer | ArrayBufferView,
    headers: AxiosRequestHeaders = {},
    axiosConfig: AxiosRequestConfig = undefined
  ): Promise<RequestResponseData> => {
    let config: AxiosRequestConfig
    if (axiosConfig) {
      config = {
        ...axiosConfig,
        ...this.requestConfig
      }
    } else {
      config = {
        baseURL: this.url,
        responseType: "text",
        ...this.requestConfig
      }
    }
    config.url = baseurl
    config.method = xhrmethod
    config.headers = headers
    config.data = postdata
    config.params = getdata
    // use the fetch adapter if fetch is available e.g. non Node<17 env
    if (typeof fetch !== "undefined") {
      config.adapter = fetchAdapter
    }
    const resp: AxiosResponse<any> = await axios.request(config)
    // purging all that is axios
    const xhrdata: RequestResponseData = new RequestResponseData(
      resp.data,
      resp.headers,
      resp.status,
      resp.statusText,
      resp.request
    )
    return xhrdata
  }

  /**
   * Makes a GET call to an API.
   *
   * @param baseurl Path to the api
   * @param getdata Object containing the key value pairs sent in GET
   * @param headers An array HTTP Request Headers
   * @param axiosConfig Configuration for the axios javascript library that will be the
   * foundation for the rest of the parameters
   *
   * @returns A promise for [[RequestResponseData]]
   */
  get = (
    baseurl: string,
    getdata: object,
    headers: object = {},
    axiosConfig: AxiosRequestConfig = undefined
  ): Promise<RequestResponseData> =>
    this._request(
      "GET",
      baseurl,
      getdata,
      {},
      this._setHeaders(headers),
      axiosConfig
    )

  /**
   * Makes a DELETE call to an API.
   *
   * @param baseurl Path to the API
   * @param getdata Object containing the key value pairs sent in DELETE
   * @param headers An array HTTP Request Headers
   * @param axiosConfig Configuration for the axios javascript library that will be the
   * foundation for the rest of the parameters
   *
   * @returns A promise for [[RequestResponseData]]
   */
  delete = (
    baseurl: string,
    getdata: object,
    headers: object = {},
    axiosConfig: AxiosRequestConfig = undefined
  ): Promise<RequestResponseData> =>
    this._request(
      "DELETE",
      baseurl,
      getdata,
      {},
      this._setHeaders(headers),
      axiosConfig
    )

  /**
   * Makes a POST call to an API.
   *
   * @param baseurl Path to the API
   * @param getdata Object containing the key value pairs sent in POST
   * @param postdata Object containing the key value pairs sent in POST
   * @param headers An array HTTP Request Headers
   * @param axiosConfig Configuration for the axios javascript library that will be the
   * foundation for the rest of the parameters
   *
   * @returns A promise for [[RequestResponseData]]
   */
  post = (
    baseurl: string,
    getdata: object,
    postdata: string | object | ArrayBuffer | ArrayBufferView,
    headers: object = {},
    axiosConfig: AxiosRequestConfig = undefined
  ): Promise<RequestResponseData> =>
    this._request(
      "POST",
      baseurl,
      getdata,
      postdata,
      this._setHeaders(headers),
      axiosConfig
    )

  /**
   * Makes a PUT call to an API.
   *
   * @param baseurl Path to the baseurl
   * @param getdata Object containing the key value pairs sent in PUT
   * @param postdata Object containing the key value pairs sent in PUT
   * @param headers An array HTTP Request Headers
   * @param axiosConfig Configuration for the axios javascript library that will be the
   * foundation for the rest of the parameters
   *
   * @returns A promise for [[RequestResponseData]]
   */
  put = (
    baseurl: string,
    getdata: object,
    postdata: string | object | ArrayBuffer | ArrayBufferView,
    headers: object = {},
    axiosConfig: AxiosRequestConfig = undefined
  ): Promise<RequestResponseData> =>
    this._request(
      "PUT",
      baseurl,
      getdata,
      postdata,
      this._setHeaders(headers),
      axiosConfig
    )

  /**
   * Makes a PATCH call to an API.
   *
   * @param baseurl Path to the baseurl
   * @param getdata Object containing the key value pairs sent in PATCH
   * @param postdata Object containing the key value pairs sent in PATCH
   * @param parameters Object containing the parameters of the API call
   * @param headers An array HTTP Request Headers
   * @param axiosConfig Configuration for the axios javascript library that will be the
   * foundation for the rest of the parameters
   *
   * @returns A promise for [[RequestResponseData]]
   */
  patch = (
    baseurl: string,
    getdata: object,
    postdata: string | object | ArrayBuffer | ArrayBufferView,
    headers: object = {},
    axiosConfig: AxiosRequestConfig = undefined
  ): Promise<RequestResponseData> =>
    this._request(
      "PATCH",
      baseurl,
      getdata,
      postdata,
      this._setHeaders(headers),
      axiosConfig
    )

  /**
   * Creates a new Avalanche instance. Sets the address and port of the main Avalanche Client.
   *
   * @param host The hostname to resolve to reach the Avalanche Client APIs
   * @param port The port to resolve to reach the Avalanche Client APIs
   * @param protocol The protocol string to use before a "://" in a request, ex: "http", "https", "git", "ws", etc ...
   */
  constructor(host?: string, port?: number, protocol: string = "http") {
    if (host != undefined) {
      this.setAddress(host, port, protocol)
    }
  }
}
