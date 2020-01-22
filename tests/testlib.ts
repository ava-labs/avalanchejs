import { API, RequestResponseData } from '../src/utils/types';
import AVACore from '../src/slopes';
import { AxiosRequestConfig } from 'axios';

export class TestAPI extends API {
    
    TestGET = async (input:string, path:string = "", axiosConfig:AxiosRequestConfig = undefined):Promise<object> => {
        return this._TestMethod("get", path, {"input":input}, axiosConfig);
    }

    TestDELETE = async (input:string, path:string = "", axiosConfig:AxiosRequestConfig = undefined):Promise<object> => {
        return this._TestMethod("delete", path, {"input":input}, axiosConfig);
    }

    TestPOST = async (input:string, path:string = "", axiosConfig:AxiosRequestConfig = undefined):Promise<object> => {
        return this._TestMethod("post", path, {}, {"input":input}, axiosConfig);
    }

    TestPUT = async (input:string, path:string = "", axiosConfig:AxiosRequestConfig = undefined):Promise<object> => {
        return this._TestMethod("put", path, {}, {"input":input}, axiosConfig);
    }

    TestPATCH = async (input:string, path:string = "", axiosConfig:AxiosRequestConfig = undefined):Promise<object> => {
        return this._TestMethod("patch", path, {}, {"input":input}, axiosConfig);
    }

    protected _respFn = (res:RequestResponseData) => {
        let response:object;
        if(typeof res.data === "string") {
            response = JSON.parse(res.data);
        } else {
            response = res.data as object;
        }
        return response["result"];
    }

    protected _TestMethod = async (method:string, path:string = "", getdata:object = {}, postdata:object = undefined, axiosConfig:AxiosRequestConfig = undefined):Promise<object> => {
        if(postdata === undefined){
            return this.ava[method](this.baseurl + path, getdata, {}, axiosConfig).then((res:RequestResponseData) => {
                return this._respFn(res);
            });
        }
        return this.ava[method](this.baseurl + path, getdata, postdata, {}, axiosConfig).then((res:RequestResponseData) => {
            res.data = JSON.stringify(res.data); //coverage completeness
            return this._respFn(res);
        });
    }

    constructor(ava:AVACore, endpoint:string = "/ext/testing"){ super(ava, endpoint); }
}
