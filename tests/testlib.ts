
import AvalancheCore from 'src/avalanche';
import { AxiosRequestConfig } from 'axios';
import { APIBase, RequestResponseData } from '../src/common/apibase';

export class TestAPI extends APIBase {
  TestGET = async (input:string, path:string = '', axiosConfig:AxiosRequestConfig = undefined):Promise<object> => this._TestMethod('get', path, { input }, axiosConfig);

  TestDELETE = async (input:string, path:string = '', axiosConfig:AxiosRequestConfig = undefined):Promise<object> => this._TestMethod('delete', path, { input }, axiosConfig);

  TestPOST = async (input:string, path:string = '', axiosConfig:AxiosRequestConfig = undefined):Promise<object> => this._TestMethod('post', path, {}, { input }, axiosConfig);

  TestPUT = async (input:string, path:string = '', axiosConfig:AxiosRequestConfig = undefined):Promise<object> => this._TestMethod('put', path, {}, { input }, axiosConfig);

  TestPATCH = async (input:string, path:string = '', axiosConfig:AxiosRequestConfig = undefined):Promise<object> => this._TestMethod('patch', path, {}, { input }, axiosConfig);

  protected _respFn = (res:RequestResponseData) => {
    let response:any;
    if (typeof res.data === 'string') {
      response = JSON.parse(res.data);
    } else {
      response = res.data as object;
    }
    return response.result;
  };

  protected _TestMethod = async (method:string, path:string = '', getdata:object = {}, postdata:object = undefined, axiosConfig:AxiosRequestConfig = undefined):Promise<object> => {
    if (postdata === undefined) {
      return this.core[method](this.baseurl + path, getdata, {}, axiosConfig).then((res:RequestResponseData) => this._respFn(res));
    }
    return this.core[method](this.baseurl + path, getdata, postdata, {}, axiosConfig).then((res:RequestResponseData) => {
      res.data = JSON.stringify(res.data); // coverage completeness
      return this._respFn(res);
    });
  };

  constructor(avax:AvalancheCore, endpoint:string = '/ext/testing') { super(avax, endpoint); }
}
