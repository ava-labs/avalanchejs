import mockAxios from 'jest-mock-axios';
import { Slopes } from "src";
import AVMAPI  from "src/apis/avm/api";
import AdminAPI  from "src/apis/admin/api";
import PlatformAPI  from "src/apis/platform/api";
import KeystoreAPI  from "src/apis/keystore/api";
import { TestAPI } from './testlib';
import { AxiosRequestConfig } from 'axios';



describe('Slopes', () => {
    const blockchainid:string = "6h2s5de1VC65meajE1L2PjvZ1MXvHc3F6eqPCGKuDt4MxiweF";
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = "https";
    let slopes:Slopes;
    beforeAll(() => {
        slopes = new Slopes(ip,port,protocol, 49, undefined, true);
        slopes.addAPI("admin", AdminAPI);
        slopes.addAPI("avm", AVMAPI, "/ext/subnet/avm", blockchainid)
        slopes.addAPI("keystore", KeystoreAPI);
        slopes.addAPI("platform", PlatformAPI);
    });
    test('Can initialize', () => {
        expect(slopes.getIP()).toBe(ip);
        expect(slopes.getPort()).toBe(port);
        expect(slopes.getProtocol()).toBe(protocol);
        expect(slopes.getURL()).toBe(`${protocol}://${ip}:${port}`);
        expect(slopes.getNetworkID()).toBe(49);
        slopes.setNetworkID(50);
        expect(slopes.getNetworkID()).toBe(50);
        slopes.setNetworkID(49);
        expect(slopes.getNetworkID()).toBe(49);
    });

    test('Endpoints correct', () => {
        expect(slopes.Admin()).not.toBeInstanceOf(AVMAPI);
        expect(slopes.Admin()).toBeInstanceOf(AdminAPI);
        
        expect(slopes.AVM()).not.toBeInstanceOf(AdminAPI);
        expect(slopes.AVM()).toBeInstanceOf(AVMAPI);
        
        expect(slopes.Platform()).not.toBeInstanceOf(KeystoreAPI);
        expect(slopes.Platform()).toBeInstanceOf(PlatformAPI);

        expect(slopes.NodeKeys()).not.toBeInstanceOf(PlatformAPI);
        expect(slopes.NodeKeys()).toBeInstanceOf(KeystoreAPI);

        expect(slopes.Admin().getRPCID()).toBe(1);
        expect(slopes.AVM().getRPCID()).toBe(1);
        expect(slopes.Platform().getRPCID()).toBe(1);
        expect(slopes.NodeKeys().getRPCID()).toBe(1);
    });

    test('Create new API', () => {
        slopes.addAPI("avm2", AVMAPI);
        expect(slopes.api("avm2")).toBeInstanceOf(AVMAPI);

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
        slopes = new Slopes(ip,port, protocol, 49, undefined, true);
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
