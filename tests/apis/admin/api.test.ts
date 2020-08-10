import mockAxios from 'jest-mock-axios';

import { Avalanche } from 'src';
import AdminAPI from 'src/apis/admin/api';

describe('Admin', () => {
  const ip = '127.0.0.1';
  const port = 9650;
  const protocol = 'https';

  const username = 'AvaLabs';
  const password = 'password';

  const avalanche:Avalanche = new Avalanche(ip, port, protocol, 12345, 'What is my purpose? You pass butter. Oh my god.', undefined, false);
  let admin:AdminAPI;

  beforeAll(() => {
    admin = avalanche.Admin();
  });

  afterEach(() => {
    mockAxios.reset();
  });

  test('getNodeID', async () => {
    const result:Promise<string> = admin.getNodeID();
    const payload:object = {
      result: {
        nodeID: 'abcd',
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe('abcd');
  });

  test('getNodeVersion', async () => {
    const result:Promise<string> = admin.getNodeVersion();
    const payload:object = {
      result: {
        version: 'avalanche/0.5.5',
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe('avalanche/0.5.5');
  });

  test('alias', async () => {
    const ep:string = '/ext/something';
    const al:string = '/ext/anotherthing';
    const result:Promise<boolean> = admin.alias(ep, al);
    const payload:object = {
      result: {
        success: true,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:boolean = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(true);
  });

  test('aliasChain', async () => {
    const ch:string = 'abcd';
    const al:string = 'myChain';
    const result:Promise<boolean> = admin.aliasChain(ch, al);
    const payload:object = {
      result: {
        success: true,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:boolean = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(true);
  });

  test('getNetworkID', async () => {
    const result:Promise<number> = admin.getNetworkID();
    const payload:object = {
      result: {
        networkID: 12345,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:number = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(12345);
  });

  test('getBlockchainID', async () => {
    const result:Promise<string> = admin.getBlockchainID('avm');
    const payload:object = {
      result: {
        blockchainID: avalanche.XChain().getBlockchainID(),
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe('What is my purpose? You pass butter. Oh my god.');
  });

  test('getNetworkName', async () => {
    const result:Promise<string> = admin.getNetworkName();
    const payload:object = {
      result: {
        networkName: 'denali',
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe('denali');
  });

  test('lockProfile', async () => {
    const result:Promise<boolean> = admin.lockProfile('filename');
    const payload:object = {
      result: {
        success: true,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:boolean = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(true);
  });

  test('memoryProfile', async () => {
    const result:Promise<boolean> = admin.memoryProfile('filename');
    const payload:object = {
      result: {
        success: true,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:boolean = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(true);
  });

  test('peers', async () => {
    const peers = ['p1', 'p2'];
    const result:Promise<Array<string>> = admin.peers();
    const payload:object = {
      result: {
        peers,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:Array<string> = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(peers);
  });

  test('startCPUProfiler', async () => {
    const result:Promise<boolean> = admin.startCPUProfiler('filename');
    const payload:object = {
      result: {
        success: true,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:boolean = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(true);
  });

  test('stopCPUProfiler', async () => {
    const result:Promise<boolean> = admin.stopCPUProfiler();
    const payload:object = {
      result: {
        success: true,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:boolean = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(true);
  });
});
