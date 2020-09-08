/**
 * @packageDocumentation
 * @module API-Metrics
 */
import AvalancheCore from '../../avalanche';
import { RESTAPI } from '../../common/restapi';
import { RequestResponseData } from '../../common/apibase';
import { AxiosRequestConfig } from 'axios';


/**
 * Class for interacting with a node API that is using the node's MetricsApi.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[RESTAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
export class MetricsAPI extends RESTAPI {
  protected axConf = ():AxiosRequestConfig => {
    return  {
      baseURL: `${this.core.getProtocol()}://${this.core.getIP()}:${this.core.getPort()}`,
      responseType: 'text',
    };

  }
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
  /**
     *
     * @returns Promise for an object containing the metrics response
     */
  getMetrics = async ():Promise<string> => this.post('')
    .then((response:RequestResponseData) => response.data as string);

  /**
     * This class should not be instantiated directly. Instead use the [[Avalanche.addAPI]] method.
     *
     * @param core A reference to the Avalanche class
     * @param baseurl Defaults to the string "/ext/metrics" as the path to blockchain's baseurl
     */
  constructor(core:AvalancheCore, baseurl:string = '/ext/metrics') { super(core, baseurl); }
}

