import mockAxios from 'jest-mock-axios';
import Slopes from "@slopes";
import AVMAPI  from "@slopes/avm/api";
import AdminAPI  from "@slopes/admin/api";
import PlatformAPI  from "@slopes/platform/api";
import KeystoreAPI  from "@slopes/keystore/api";
import { TestAPI } from './testlib';
import { AxiosRequestConfig } from 'axios';

describe('Slopes', () => {
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = "https";
    let ava:Slopes;
    beforeAll(() => {
        ava = new Slopes(ip,port,protocol);
    });
    test('Can initialize', () => {
        expect(ava.getIP()).toBe(ip);
        expect(ava.getPort()).toBe(port);
        expect(ava.getProtocol()).toBe(protocol);
        expect(ava.getURL()).toBe(`${protocol}://${ip}:${port}`);
        
    });

    test('Endpoints correct', () => {
        expect(ava.Admin()).not.toBeInstanceOf(AVMAPI);
        expect(ava.Admin()).toBeInstanceOf(AdminAPI);
        
        expect(ava.AVM()).not.toBeInstanceOf(AdminAPI);
        expect(ava.AVM()).toBeInstanceOf(AVMAPI);
        
        expect(ava.Platform()).not.toBeInstanceOf(KeystoreAPI);
        expect(ava.Platform()).toBeInstanceOf(PlatformAPI);

        expect(ava.NodeKeys()).not.toBeInstanceOf(PlatformAPI);
        expect(ava.NodeKeys()).toBeInstanceOf(KeystoreAPI);

        expect(ava.Admin().getRPCID()).toBe(1);
        expect(ava.AVM().getRPCID()).toBe(1);
        expect(ava.Platform().getRPCID()).toBe(1);
        expect(ava.NodeKeys().getRPCID()).toBe(1);
    });

    test('Create new API', () => {
        ava.addAPI("admin2", AVMAPI);
        expect(ava.api("admin2")).toBeInstanceOf(AVMAPI);

        ava.addAPI("keystore2", KeystoreAPI, "/ext/keystore2");
        expect(ava.api("keystore2")).toBeInstanceOf(KeystoreAPI);

        ava.api("keystore2").setBaseURL("/ext/keystore3");
        expect(ava.api("keystore2").getBaseURL()).toBe("/ext/keystore3");

        expect(ava.api("keystore2").getDB()).toHaveProperty("namespace");
    });

});

describe('HTTP Operations', () => {
    const ip = '127.0.0.1';
    const port = 8080;
    const protocol = "http";
    const path = "/ext/testingrequests";
    let ava:Slopes;
    beforeAll(() => {
        ava = new Slopes(ip,port, protocol);
        ava.addAPI("testingrequests", TestAPI, path);
    });

    afterEach(() => {
        mockAxios.reset();
    });

    test('GET works', async () => {
        let input:string = "TestGET";
        let api:TestAPI = ava.api("testingrequests");
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
        let api:TestAPI = ava.api("testingrequests");
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
        let api:TestAPI = ava.api("testingrequests");
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
        let api:TestAPI = ava.api("testingrequests");
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
        let api:TestAPI = ava.api("testingrequests");
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
