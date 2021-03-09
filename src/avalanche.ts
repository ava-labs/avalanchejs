/**
 * @packageDocumentation
 * @module AvalancheCore
 */
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { APIBase, RequestResponseData } from './common/apibase';
import { getPreferredHRP } from './utils/helperfunctions';

/**
 * AvalancheCore is middleware for interacting with Avalanche node RPC APIs.
 *
 * Example usage:
 * ```js
 * let avalanche = new AvalancheCore("127.0.0.1", 9650, "https");
 * ```
 *
 */
export default class AvalancheCore {
  protected networkID:number = 0;

  protected hrp:string = '';

  protected protocol:string;

  protected ip:string;

  protected port:number;

  protected url:string;

  protected auth:string = undefined;

  protected headers:{ [k: string]: string } = {};

  protected apis:{ [k: string]: APIBase } = {};

  /**
     * Sets the address and port of the main Avalanche Client.
     *
     * @param ip The hostname to resolve to reach the Avalanche Client RPC APIs
     * @param port The port to resolve to reach the Avalanche Client RPC APIs
     * @param protocol The protocol string to use before a "://" in a request,
     * ex: "http", "https", "git", "ws", etc ...
     */
  setAddress = (ip:string, port:number, protocol:string = 'http') => {
    this.ip = ip;
    this.port = port;
    this.protocol = protocol;
    this.url = `${protocol}://${ip}:${port}`;
  };

  /**
     * Returns the protocol such as "http", "https", "git", "ws", etc.
     */
  getProtocol = ():string => this.protocol;

  /**
     * Returns the IP for the Avalanche node.
     */
  getIP = ():string => this.ip;

  /**
     * Returns the port for the Avalanche node.
     */
  getPort = ():number => this.port;

  /**
     * Returns the URL of the Avalanche node (ip + port);
     */
  getURL = ():string => this.url;

  /**
   * Returns the custom headers
   */
  getHeaders = ():object => this.headers;

  /**
     * Returns the networkID;
     */
  getNetworkID = ():number => this.networkID;

  /**
     * Sets the networkID
     */
  setNetworkID = (netid:number) => {
    this.networkID = netid;
    this.hrp = getPreferredHRP(this.networkID);
  };

  /**
   * Returns the Human-Readable-Part of the network associated with this key.
   *
   * @returns The [[KeyPair]]'s Human-Readable-Part of the network's Bech32 addressing scheme
   */
  getHRP = ():string => this.hrp;

  /**
   * Sets the the Human-Readable-Part of the network associated with this key.
   *
   * @param hrp String for the Human-Readable-Part of Bech32 addresses
   */
  setHRP = (hrp:string):void => {
    this.hrp = hrp;
  };

  /**
   * Adds a new custom header to be included with all requests.
   *
   * @param key Header name
   * @param value Header value
   */
  setHeader = (key:string,value:string):void => {
    this.headers[key] = value
  }

  /**
   * Sets the temporary auth token used for communicating with the node.
   *
   * @param auth A temporary token provided by the node enabling access to the endpoints on the node.
   */
  setAuthToken = (auth:string):void => {
    this.auth = auth;
  }

  protected _setHeaders = (headers:object):object => {
    if (typeof this.headers === "object") {
      for (const [key, value] of Object.entries(this.headers)) {
        headers[key] = value;
      }
    }

    if(typeof this.auth === "string"){
      headers["Authorization"] = "Bearer " + this.auth;
    }
    return headers;
  }

  /**
   * Adds an API to the middleware. The API resolves to a registered blockchain's RPC.
   *
   * In TypeScript:
   * ```js
   * avalanche.addAPI<MyVMClass>("mychain", MyVMClass, "/ext/bc/mychain");
   * ```
   *
   * In Javascript:
   * ```js
   * avalanche.addAPI("mychain", MyVMClass, "/ext/bc/mychain");
   * ```
   *
   * @typeparam GA Class of the API being added
   * @param apiName A label for referencing the API in the future
   * @param ConstructorFN A reference to the class which instantiates the API
   * @param baseurl Path to resolve to reach the API
   *
   */
  addAPI = <GA extends APIBase>(apiName:string,
    ConstructorFN: new(avax:AvalancheCore, baseurl?:string, ...args:Array<any>) => GA,
    baseurl:string = undefined,
    ...args:Array<any>) => {
    if (typeof baseurl === 'undefined') {
      this.apis[apiName] = new ConstructorFN(this, undefined, ...args);
    } else {
      this.apis[apiName] = new ConstructorFN(this, baseurl, ...args);
    }
  };

  /**
   * Retrieves a reference to an API by its apiName label.
   *
   * @param apiName Name of the API to return
   */
  api = <GA extends APIBase>(apiName:string): GA => this.apis[apiName] as GA;

  /**
   * @ignore
   */
  protected _request = async (xhrmethod:Method,
    baseurl:string,
    getdata:object,
    postdata:string | object | ArrayBuffer | ArrayBufferView,
    headers:object = {},
    axiosConfig:AxiosRequestConfig = undefined): Promise<RequestResponseData> => {
    let config:AxiosRequestConfig;
    if (axiosConfig) {
      config = axiosConfig;
    } else {
      config = {
        baseURL: `${this.protocol}://${this.ip}:${this.port}`,
        responseType: 'text',
      };
    }
    config.url = baseurl;
    config.method = xhrmethod;
    config.headers = headers;
    config.data = postdata;
    config.params = getdata;
    return axios.request(config).then((resp:AxiosResponse<any>) => {
      // purging all that is axios
      const xhrdata:RequestResponseData = new RequestResponseData();
      xhrdata.data = resp.data;
      xhrdata.headers = resp.headers;
      xhrdata.request = resp.request;
      xhrdata.status = resp.status;
      xhrdata.statusText = resp.statusText;
      return xhrdata;
    });
  };

  /**
   * Makes a GET call to an API.
   *
   * @param baseurl Path to the api
   * @param getdata Object containing the key value pairs sent in GET
   * @param parameters Object containing the parameters of the API call
   * @param headers An array HTTP Request Headers
   * @param axiosConfig Configuration for the axios javascript library that will be the
   * foundation for the rest of the parameters
   *
   * @returns A promise for [[RequestResponseData]]
   */
  get = (baseurl:string,
    getdata:object,
    headers:object = {},
    axiosConfig:AxiosRequestConfig = undefined)
  : Promise<RequestResponseData> =>  this._request('GET',
      baseurl,
      getdata,
      {},
      this._setHeaders(headers),
      axiosConfig);

  /**
   * Makes a DELETE call to an API.
   *
   * @param baseurl Path to the API
   * @param getdata Object containing the key value pairs sent in DELETE
   * @param parameters Object containing the parameters of the API call
   * @param headers An array HTTP Request Headers
   * @param axiosConfig Configuration for the axios javascript library that will be the
   * foundation for the rest of the parameters
   *
   * @returns A promise for [[RequestResponseData]]
   */
  delete = (baseurl:string,
    getdata:object,
    headers:object = {},
    axiosConfig:AxiosRequestConfig = undefined)
  : Promise<RequestResponseData> => this._request('DELETE',
    baseurl,
    getdata,
    {},
    this._setHeaders(headers),
    axiosConfig);

  /**
   * Makes a POST call to an API.
   *
   * @param baseurl Path to the API
   * @param getdata Object containing the key value pairs sent in POST
   * @param postdata Object containing the key value pairs sent in POST
   * @param parameters Object containing the parameters of the API call
   * @param headers An array HTTP Request Headers
   * @param axiosConfig Configuration for the axios javascript library that will be the
   * foundation for the rest of the parameters
   *
   * @returns A promise for [[RequestResponseData]]
   */
  post = (baseurl:string,
    getdata:object,
    postdata:string | object | ArrayBuffer | ArrayBufferView,
    headers:object = {},
    axiosConfig:AxiosRequestConfig = undefined)
  : Promise<RequestResponseData> => this._request('POST',
    baseurl,
    getdata,
    postdata,
    this._setHeaders(headers),
    axiosConfig);

  /**
   * Makes a PUT call to an API.
   *
   * @param baseurl Path to the baseurl
   * @param getdata Object containing the key value pairs sent in PUT
   * @param postdata Object containing the key value pairs sent in PUT
   * @param parameters Object containing the parameters of the API call
   * @param headers An array HTTP Request Headers
   * @param axiosConfig Configuration for the axios javascript library that will be the
   * foundation for the rest of the parameters
   *
   * @returns A promise for [[RequestResponseData]]
   */
  put = (baseurl:string,
    getdata:object,
    postdata:string | object | ArrayBuffer | ArrayBufferView,
    headers:object = {},
    axiosConfig:AxiosRequestConfig = undefined)
  : Promise<RequestResponseData> => this._request('PUT',
    baseurl,
    getdata,
    postdata,
    this._setHeaders(headers),
    axiosConfig);

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
  patch = (baseurl:string,
    getdata:object,
    postdata:string | object | ArrayBuffer | ArrayBufferView,
    headers:object = {},
    axiosConfig:AxiosRequestConfig = undefined)
  : Promise<RequestResponseData> => this._request('PATCH',
    baseurl,
    getdata,
    postdata,
    this._setHeaders(headers),
    axiosConfig);

  /**
   * Creates a new Avalanche instance. Sets the address and port of the main Avalanche Client.
   *
   * @param ip The hostname to resolve to reach the Avalanche Client APIs
   * @param port The port to resolve to reach the Avalanche Client APIs
   * @param protocol The protocol string to use before a "://" in a request, ex: "http", "https", "git", "ws", etc ...
   */
  constructor(ip:string, port:number, protocol:string = 'http') {
    this.setAddress(ip, port, protocol);
  }
}
