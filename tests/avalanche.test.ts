import mockAxios from 'jest-mock-axios';
import { Avalanche } from "src";
import AVMAPI  from "src/apis/avm/api";
import AdminAPI  from "src/apis/admin/api";
import PlatformAPI  from "src/apis/platform/api";
import KeystoreAPI  from "src/apis/keystore/api";
import { TestAPI } from './testlib';
import { AxiosRequestConfig } from 'axios';



describe('Avalanche', () => {
    const blockchainid:string = "6h2s5de1VC65meajE1L2PjvZ1MXvHc3F6eqPCGKuDt4MxiweF";
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = "https";
    let avalanche:Avalanche;
    beforeAll(() => {
        avalanche = new Avalanche(ip,port,protocol, 12345, undefined, true);
        avalanche.addAPI("admin", AdminAPI);
        avalanche.addAPI("avm", AVMAPI, "/ext/subnet/avm", blockchainid)
        avalanche.addAPI("keystore", KeystoreAPI);
        avalanche.addAPI("platform", PlatformAPI);
    });
    test('Can initialize', () => {
        expect(avalanche.getIP()).toBe(ip);
        expect(avalanche.getPort()).toBe(port);
        expect(avalanche.getProtocol()).toBe(protocol);
        expect(avalanche.getURL()).toBe(`${protocol}://${ip}:${port}`);
        expect(avalanche.getNetworkID()).toBe(12345);
        avalanche.setNetworkID(50);
        expect(avalanche.getNetworkID()).toBe(50);
        avalanche.setNetworkID(12345);
        expect(avalanche.getNetworkID()).toBe(12345);
    });

    test('Endpoints correct', () => {
        expect(avalanche.Admin()).not.toBeInstanceOf(AVMAPI);
        expect(avalanche.Admin()).toBeInstanceOf(AdminAPI);
        
        expect(avalanche.AVM()).not.toBeInstanceOf(AdminAPI);
        expect(avalanche.AVM()).toBeInstanceOf(AVMAPI);
        
        expect(avalanche.Platform()).not.toBeInstanceOf(KeystoreAPI);
        expect(avalanche.Platform()).toBeInstanceOf(PlatformAPI);

        expect(avalanche.NodeKeys()).not.toBeInstanceOf(PlatformAPI);
        expect(avalanche.NodeKeys()).toBeInstanceOf(KeystoreAPI);

        expect(avalanche.Admin().getRPCID()).toBe(1);
        expect(avalanche.AVM().getRPCID()).toBe(1);
        expect(avalanche.Platform().getRPCID()).toBe(1);
        expect(avalanche.NodeKeys().getRPCID()).toBe(1);
    });

    test('Create new API', () => {
        avalanche.addAPI("avm2", AVMAPI);
        expect(avalanche.api("avm2")).toBeInstanceOf(AVMAPI);

        avalanche.addAPI("keystore2", KeystoreAPI, "/ext/keystore2");
        expect(avalanche.api("keystore2")).toBeInstanceOf(KeystoreAPI);

        avalanche.api("keystore2").setBaseURL("/ext/keystore3");
        expect(avalanche.api("keystore2").getBaseURL()).toBe("/ext/keystore3");

        expect(avalanche.api("keystore2").getDB()).toHaveProperty("namespace");
    });

});

describe('HTTP Operations', () => {
    const ip = '127.0.0.1';
    const port = 8080;
    const protocol = "http";
    const path = "/ext/testingrequests";
    let avalanche:Avalanche;
    beforeAll(() => {
        avalanche = new Avalanche(ip,port, protocol, 12345, undefined, true);
        avalanche.addAPI("testingrequests", TestAPI, path);
    });

    afterEach(() => {
        mockAxios.reset();
    });

    test('GET works', async () => {
        let input:string = "TestGET";
        let api:TestAPI = avalanche.api("testingrequests");
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
        let api:TestAPI = avalanche.api("testingrequests");
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
        let api:TestAPI = avalanche.api("testingrequests");
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
        let api:TestAPI = avalanche.api("testingrequests");
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
        let api:TestAPI = avalanche.api("testingrequests");
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
