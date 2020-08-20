/**
 * @packageDocumentation
 * @module Common-RESTAPI
 */

import { AxiosRequestConfig } from 'axios';
import BinTools from '../utils/bintools';
import AvalancheCore from '../avalanche';
import { APIBase, RequestResponseData } from './apibase';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

export class RESTAPI extends APIBase {
  protected contentType:string;

  protected acceptType:string;

  protected prepHeaders = (contentType?:string, acceptType?:string):object => {
    const headers:object = {};
    if (contentType !== undefined) {
      headers['Content-Type'] = contentType;
    } else {
      headers['Content-Type'] = this.contentType;
    }

    if (acceptType !== undefined) {
      headers["Accept"] = acceptType;
    } else if (this.acceptType !== undefined) {
      headers["Accept"] = this.acceptType;
    }
    return headers;
  }

  protected axConf = ():AxiosRequestConfig => {
    return  {
      baseURL: `${this.core.getProtocol()}://${this.core.getIP()}:${this.core.getPort()}`,
      responseType: 'json',
    };

  }

  get = async (baseurl?:string, contentType?:string, acceptType?:string):Promise<RequestResponseData> => {
    const ep:string = baseurl || this.baseurl;

    let headers:object = this.prepHeaders(contentType, acceptType);

    return this.core.get(ep, {}, headers, this.axConf()).then((resp:RequestResponseData) => resp);
  };

  post = async (method:string, params?:Array<object> | object, baseurl?:string,
    contentType?:string, acceptType?:string):Promise<RequestResponseData> => {
    const ep:string = baseurl || this.baseurl;
    const rpc:any = {};
    rpc.method = method;

    // Set parameters if exists
    if (params) {
      rpc.params = params;
    }

    const headers:object = this.prepHeaders(contentType, acceptType);

    return this.core.post(ep, {}, JSON.stringify(rpc), headers, this.axConf())
      .then((resp:RequestResponseData) => resp);
  };

  put = async (method:string,
    params?:Array<object> | object,
    baseurl?:string,
    contentType?:string,
    acceptType?:string):Promise<RequestResponseData> => {
    const ep:string = baseurl || this.baseurl;
    const rpc:any = {};
    rpc.method = method;

    // Set parameters if exists
    if (params) {
      rpc.params = params;
    }

    const headers:object = this.prepHeaders(contentType, acceptType);

    return this.core.put(ep, {}, JSON.stringify(rpc), headers, this.axConf())
      .then((resp:RequestResponseData) => resp);
  };

  delete = async (method:string, params?:Array<object> | object, baseurl?:string,
    contentType?:string, acceptType?:string):Promise<RequestResponseData> => {
    const ep:string = baseurl || this.baseurl;
    const rpc:any = {};
    rpc.method = method;

    // Set parameters if exists
    if (params) {
      rpc.params = params;
    }

    const headers:object = this.prepHeaders(contentType, acceptType);

    return this.core.delete(ep, {}, headers, this.axConf()).then((resp:RequestResponseData) => resp);
  };

  patch = async (method:string, params?:Array<object> | object, baseurl?:string,
    contentType?:string, acceptType?:string):Promise<RequestResponseData> => {
    const ep:string = baseurl || this.baseurl;
    const rpc:any = {};
    rpc.method = method;

    // Set parameters if exists
    if (params) {
      rpc.params = params;
    }

    const headers:object = this.prepHeaders(contentType, acceptType);

    return this.core.patch(ep, {}, JSON.stringify(rpc), headers, this.axConf())
      .then((resp:RequestResponseData) => resp);
  };

  /**
     * Returns the type of the entity attached to the incoming request
     */
  getContentType = ():string => this.contentType;

  /**
     * Returns what type of representation is desired at the client side
     */
  getAcceptType = ():string => this.acceptType;

  /**
     *
     * @param core Reference to the Avalanche instance using this endpoint
     * @param baseurl Path of the APIs baseurl - ex: "/ext/bc/avm"
     * @param contentType Optional Determines the type of the entity attached to the
     * incoming request
     * @param acceptType Optional Determines the type of representation which is
     * desired on the client side
     */
  constructor(core:AvalancheCore,
    baseurl:string,
    contentType:string = 'application/json;charset=UTF-8',
    acceptType:string = undefined) {
    super(core, baseurl);
    this.contentType = contentType;
    this.acceptType = acceptType;
  }
}






