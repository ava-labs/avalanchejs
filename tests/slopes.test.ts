import mockAxios from 'jest-mock-axios';
import { Slopes, TypesLibrary } from "src";
import AVMAPI  from "src/apis/avm/api";
import AdminAPI  from "src/apis/admin/api";
import PlatformAPI  from "src/apis/platform/api";
import KeystoreAPI  from "src/apis/keystore/api";
import { TestAPI } from './testlib';
import { AxiosRequestConfig } from 'axios';



describe('Slopes', () => {
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = "https";
    let slopes:Slopes;
    beforeAll(() => {
        slopes = new Slopes(ip,port,protocol);
    });
    test('Can initialize', () => {
        expect(slopes.getIP()).toBe(ip);
        expect(slopes.getPort()).toBe(port);
        expect(slopes.getProtocol()).toBe(protocol);
        expect(slopes.getURL()).toBe(`${protocol}://${ip}:${port}`);
        
    });

    test('Endpoints correct', () => {
        expect(slopes.Admin()).not.toBeInstanceOf(TypesLibrary.AVM.API);
        expect(slopes.Admin()).toBeInstanceOf(TypesLibrary.Admin.API);
        
        expect(slopes.AVM()).not.toBeInstanceOf(TypesLibrary.Admin.API);
        expect(slopes.AVM()).toBeInstanceOf(TypesLibrary.AVM.API);
        
        expect(slopes.Platform()).not.toBeInstanceOf(TypesLibrary.Keystore.API);
        expect(slopes.Platform()).toBeInstanceOf(TypesLibrary.Platform.API);

        expect(slopes.NodeKeys()).not.toBeInstanceOf(TypesLibrary.Platform.API);
        expect(slopes.NodeKeys()).toBeInstanceOf(TypesLibrary.Keystore.API);

        expect(slopes.Admin().getRPCID()).toBe(1);
        expect(slopes.AVM().getRPCID()).toBe(1);
        expect(slopes.Platform().getRPCID()).toBe(1);
        expect(slopes.NodeKeys().getRPCID()).toBe(1);
    });

    test('Create new API', () => {
        slopes.addAPI("admin2", AVMAPI);
        expect(slopes.api("admin2")).toBeInstanceOf(AVMAPI);

        slopes.addAPI("keystore2", KeystoreAPI, "/ext/keystore2");
        expect(slopes.api("keystore2")).toBeInstanceOf(KeystoreAPI);

        slopes.api("keystore2").setBaseURL("/ext/keystore3");
        expect(slopes.api("keystore2").getBaseURL()).toBe("/ext/keystore3");

        expect(slopes.api("keystore2").getDB()).toHaveProperty("namespace");
    });

});

describe('HTTP Operations', () => {
    const ip = '127.0.0.1';
    const port = 8080;
    const protocol = "http";
    const path = "/ext/testingrequests";
    let slopes:Slopes;
    beforeAll(() => {
        slopes = new Slopes(ip,port, protocol);
        slopes.addAPI("testingrequests", TestAPI, path);
    });

    afterEach(() => {
        mockAxios.reset();
    });

    test('GET works', async () => {
        let input:string = "TestGET";
        let api:TestAPI = slopes.api("testingrequests");
        let result:Promise<object> = api.TestGET(input, `/${input}`);
        let payload:object = {
            "result": {
                "output":input
            }
        };
        let responseObj = {
            data:payload
        };
        mockAxios.mockResponse(responseObj);
        let response:object = await result;
        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response["output"]).toBe(input);
    });

    test('DELETE works', async () => {
        let input:string = "TestDELETE";
        let api:TestAPI = slopes.api("testingrequests");
        let axiosConfig:AxiosRequestConfig = {
            baseURL:`${protocol}://${ip}:${port}`,
            responseType: 'text'
        };
        let result:Promise<object> = api.TestDELETE(input, `/${input}`, axiosConfig);
        let payload:object = {
            "result": {
                "output":input
            }
        };
        let responseObj = {
            data:payload
        };
        mockAxios.mockResponse(responseObj);
        let response:object = await result;
        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response["output"]).toBe(input);
    });

    test('POST works', async () => {
        let input:string = "TestPOST";
        let api:TestAPI = slopes.api("testingrequests");
        let result:Promise<object> = api.TestPOST(input, `/${input}`);
        let payload:object = {
            "result": {
                "output":input
            }
        };
        let responseObj = {
            data:payload
        };
        mockAxios.mockResponse(responseObj);
        let response:object = await result;
        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response["output"]).toBe(input);
    });

    test('PUT works', async () => {
        let input:string = "TestPUT";
        let api:TestAPI = slopes.api("testingrequests");
        let result:Promise<object> = api.TestPUT(input, `/${input}`);
        let payload:object = {
            "result": {
                "output":input
            }
        };
        let responseObj = {
            data:payload
        };
        mockAxios.mockResponse(responseObj);
        let response:object = await result;
        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response["output"]).toBe(input);
    });

    test('PATCH works', async () => {
        let input:string = "TestPATCH";
        let api:TestAPI = slopes.api("testingrequests");
        let result:Promise<object> = api.TestPATCH(input, `/${input}`);
        let payload:object = {
            "result": {
                "output":input
            }
        };
        let responseObj = {
            data:payload
        };
        mockAxios.mockResponse(responseObj);
        let response:object = await result;
        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response["output"]).toBe(input);
    });
});
