import mockAxios from 'jest-mock-axios';
import { Avalanche } from "src";
import { AVMAPI } from "src/apis/avm/api";
import { AdminAPI } from "src/apis/admin/api";
import { HealthAPI } from 'src/apis/health/api';
import { InfoAPI } from "src/apis/info/api";
import { KeystoreAPI } from "src/apis/keystore/api";
import { MetricsAPI } from "src/apis/metrics/api";
import { PlatformVMAPI }  from "src/apis/platformvm/api";
import { TestAPI } from './testlib';
import { AxiosRequestConfig } from 'axios';

describe('Avalanche', () => {
    const blockchainid:string = "6h2s5de1VC65meajE1L2PjvZ1MXvHc3F6eqPCGKuDt4MxiweF";
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = "https";
    let avalanche:Avalanche;
    beforeAll(() => {
        avalanche = new Avalanche(ip,port,protocol, 12345, undefined, undefined, undefined, true);
        avalanche.addAPI("admin", AdminAPI);
        avalanche.addAPI("xchain", AVMAPI, "/ext/subnet/avm", blockchainid)
        avalanche.addAPI("health", HealthAPI);
        avalanche.addAPI("info", InfoAPI);
        avalanche.addAPI("keystore", KeystoreAPI);
        avalanche.addAPI("metrics", MetricsAPI);
        avalanche.addAPI("pchain", PlatformVMAPI);
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
        
        expect(avalanche.XChain()).not.toBeInstanceOf(AdminAPI);
        expect(avalanche.XChain()).toBeInstanceOf(AVMAPI);

        expect(avalanche.Health()).not.toBeInstanceOf(KeystoreAPI);
        expect(avalanche.Health()).toBeInstanceOf(HealthAPI);

        expect(avalanche.Info()).not.toBeInstanceOf(KeystoreAPI);
        expect(avalanche.Info()).toBeInstanceOf(InfoAPI);
        
        expect(avalanche.PChain()).not.toBeInstanceOf(KeystoreAPI);
        expect(avalanche.PChain()).toBeInstanceOf(PlatformVMAPI);

        expect(avalanche.NodeKeys()).not.toBeInstanceOf(PlatformVMAPI);
        expect(avalanche.NodeKeys()).toBeInstanceOf(KeystoreAPI);

        expect(avalanche.Metrics()).not.toBeInstanceOf(KeystoreAPI);
        expect(avalanche.Metrics()).toBeInstanceOf(MetricsAPI);

        expect(avalanche.Admin().getRPCID()).toBe(1);
        expect(avalanche.XChain().getRPCID()).toBe(1);
        expect(avalanche.PChain().getRPCID()).toBe(1);
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
  const protocol = 'http';
  const path = '/ext/testingrequests';
  let avalanche:Avalanche;
  beforeAll(() => {
    avalanche = new Avalanche(ip, port, protocol, 12345, undefined, undefined, undefined, true);
    avalanche.addAPI('testingrequests', TestAPI, path);
  });

  afterEach(() => {
    mockAxios.reset();
  });

  test('GET works', async () => {
    const input:string = 'TestGET';
    const api:TestAPI = avalanche.api('testingrequests');
    const result:Promise<object> = api.TestGET(input, `/${input}`);
    const payload:object = {
      result: {
        output: input,
      },
    };
    const responseObj = {
      data: payload,
    };
    mockAxios.mockResponse(responseObj);
    const response:any = await result;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.output).toBe(input);
  });

  test('DELETE works', async () => {
    const input:string = 'TestDELETE';
    const api:TestAPI = avalanche.api('testingrequests');
    const axiosConfig:AxiosRequestConfig = {
      baseURL: `${protocol}://${ip}:${port}`,
      responseType: 'text',
    };
    const result:Promise<object> = api.TestDELETE(input, `/${input}`, axiosConfig);
    const payload:object = {
      result: {
        output: input,
      },
    };
    const responseObj = {
      data: payload,
    };
    mockAxios.mockResponse(responseObj);
    const response:any = await result;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.output).toBe(input);
  });

  test('POST works', async () => {
    const input:string = 'TestPOST';
    const api:TestAPI = avalanche.api('testingrequests');
    const result:Promise<object> = api.TestPOST(input, `/${input}`);
    const payload:object = {
      result: {
        output: input,
      },
    };
    const responseObj = {
      data: payload,
    };
    mockAxios.mockResponse(responseObj);
    const response:any = await result;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.output).toBe(input);
  });

  test('PUT works', async () => {
    const input:string = 'TestPUT';
    const api:TestAPI = avalanche.api('testingrequests');
    const result:Promise<object> = api.TestPUT(input, `/${input}`);
    const payload:object = {
      result: {
        output: input,
      },
    };
    const responseObj = {
      data: payload,
    };
    mockAxios.mockResponse(responseObj);
    const response:any = await result;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.output).toBe(input);
  });

  test('PATCH works', async () => {
    const input:string = 'TestPATCH';
    const api:TestAPI = avalanche.api('testingrequests');
    const result:Promise<object> = api.TestPATCH(input, `/${input}`);
    const payload:object = {
      result: {
        output: input,
      },
    };
    const responseObj = {
      data: payload,
    };
    mockAxios.mockResponse(responseObj);
    const response:any = await result;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.output).toBe(input);
  });
});
