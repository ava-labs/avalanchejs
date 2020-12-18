import mockAxios from 'jest-mock-axios';
import { Avalanche, BN } from "src";
import { EVMAPI } from "src/apis/evm/api";
import BinTools from 'src/utils/bintools';
import * as bech32 from 'bech32';
import { Defaults } from 'src/utils/constants';

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance();

describe('EVMAPI', () => {
  const networkid: number = 12345;
  const blockchainid: string = Defaults.network[networkid].C.blockchainID;
  const ip: string = '127.0.0.1';
  const port: number = 9650;
  const protocol: string = 'https';

  const username: string = 'AvaLabs';
  const password: string = 'password';

  const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkid, undefined, undefined, undefined, true);
  let api: EVMAPI;


  const addrA: string = 'C-' + bech32.encode(avalanche.getHRP(), bech32.toWords(bintools.cb58Decode("B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW")));
  const addrB: string = 'C-' + bech32.encode(avalanche.getHRP(), bech32.toWords(bintools.cb58Decode("P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF")));
  const addrC: string = 'C-' + bech32.encode(avalanche.getHRP(), bech32.toWords(bintools.cb58Decode("6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV")));

  beforeAll(() => {
    api = new EVMAPI(avalanche, '/ext/bc/C/avax', blockchainid);
  });

  afterEach(() => {
    mockAxios.reset();
  });

  test('importKey', async () => {
    const address: string = addrC;

    const result: Promise<string> = api.importKey(username, password, 'key');
    const payload: object = {
      result: {
        address,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response: string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(address);
  });

  test('exportKey', async () => {
    const key: string = 'sdfglvlj2h3v45';

    const result: Promise<string> = api.exportKey(username, password, addrA);
    const payload: object = {
      result: {
        privateKey: key,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(key);
  });

  test("exportAVAX", async () =>{
    let amount: BN = new BN(100);
    let to: string = "abcdef";
    let username: string = "Robert";
    let password: string = "Paulson";
    let txID: string = "valid";
    let result: Promise<string> = api.exportAVAX(username, password, to, amount);
    let payload: object = {
        "result": {
            "txID": txID
        }
    };
    let responseObj = {
        data: payload
    };

    mockAxios.mockResponse(responseObj);
    let response: string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(txID);
  });

  test("export", async () =>{
    let amount: BN = new BN(100);
    let to: string = "abcdef";
    let assetID: string = "2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe"
    let username: string = "Robert";
    let password: string = "Paulson";
    let txID: string = "valid";
    let result: Promise<string> = api.export(username, password, to, amount, assetID);
    let payload: object = {
        "result": {
            "txID": txID
        }
    };
    let responseObj = {
        data: payload
    };

    mockAxios.mockResponse(responseObj);
    let response: string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(txID);
  });

  test("importAVAX", async () =>{
    let to: string = "abcdef";
    let username: string = "Robert";
    let password: string = "Paulson";
    let txID: string = "valid";
    let result: Promise<string> = api.importAVAX(username, password, to, blockchainid);
    let payload: object = {
        "result": {
            "txID": txID
        }
    };
    let responseObj = {
        data: payload
    };

    mockAxios.mockResponse(responseObj);
    let response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(txID);
  });

  test("import", async () =>{
    let to: string = "abcdef";
    let username: string = "Robert";
    let password: string = "Paulson";
    let txID: string = "valid";
    let result: Promise<string> = api.import(username, password, to, blockchainid);
    let payload: object = {
        "result": {
            "txID": txID
        }
    };
    let responseObj = {
        data: payload
    };

    mockAxios.mockResponse(responseObj);
    let response: string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(txID);
  });

  test('refreshBlockchainID', async () => {
    const n5bcID: string = Defaults.network[5].C["blockchainID"];
    const n12345bcID: string = Defaults.network[12345].C["blockchainID"];
    const testAPI: EVMAPI = new EVMAPI(avalanche, '/ext/bc/C/avax', n5bcID);
    const bc1: string = testAPI.getBlockchainID();
    expect(bc1).toBe(n5bcID);

    let res: boolean = testAPI.refreshBlockchainID();
    expect(res).toBeTruthy();
    const bc2: string = testAPI.getBlockchainID();
    expect(bc2).toBe(n12345bcID);

    res = testAPI.refreshBlockchainID(n5bcID);
    expect(res).toBeTruthy();
    const bc3: string = testAPI.getBlockchainID();
    expect(bc3).toBe(n5bcID);

  });
});