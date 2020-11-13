import mockAxios from 'jest-mock-axios';
import { Avalanche } from 'src';
import { InfoAPI } from 'src/apis/info/api';
import BN from "bn.js";

describe('Info', () => {
  const ip:string = '127.0.0.1';
  const port:number = 9650;
  const protocol:string = 'https';

  const avalanche:Avalanche = new Avalanche(ip, port, protocol, 12345, 'What is my purpose? You pass butter. Oh my god.', undefined, undefined, false);
  let info:InfoAPI;

  beforeAll(() => {
    info = avalanche.Info();
  });

  afterEach(() => {
    mockAxios.reset();
  });

  test('getBlockchainID', async () => {
    const result:Promise<string> = info.getBlockchainID('X');
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

  test('getNetworkID', async () => {
    const result:Promise<number> = info.getNetworkID();
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

  test('getTxFee', async () => {
    const result:Promise<{txFee:BN, creationTxFee:BN}> = info.getTxFee();
    const payload:object = {
      result: {
        txFee: "1000000",
        creationTxFee: "10000000"
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:{txFee:BN, creationTxFee:BN} = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.txFee.eq(new BN('1000000'))).toBe(true);
    expect(response.creationTxFee.eq(new BN('10000000'))).toBe(true);
  });

  test('getNetworkName', async () => {
    const result:Promise<string> = info.getNetworkName();
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

  test('getNodeID', async () => {
    const result:Promise<string> = info.getNodeID();
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
    const result:Promise<string> = info.getNodeVersion();
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

  test('isBootstrapped false', async () => {
    const result:Promise<boolean> = info.isBootstrapped('X');
    const payload:object = {
      result: {
        isBootstrapped: false,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:boolean = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(false);
  });

  test('isBootstrapped true', async () => {
    const result:Promise<boolean> = info.isBootstrapped('P');
    const payload:object = {
      result: {
        isBootstrapped: true,
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
    const result:Promise<Array<string>> = info.peers();
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
});
