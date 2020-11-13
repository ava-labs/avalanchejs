import mockAxios from 'jest-mock-axios';

import { Avalanche } from 'src';
import { KeystoreAPI } from 'src/apis/keystore/api';

describe('Keystore', () => {
  const ip = '127.0.0.1';
  const port = 9650;
  const protocol = 'https';

  const username = 'AvaLabs';
  const password = 'password';

  const avalanche = new Avalanche(ip, port, protocol, 12345, undefined, undefined, undefined, true);
  let keystore:KeystoreAPI;

  beforeAll(() => {
    keystore = new KeystoreAPI(avalanche);
  });

  afterEach(() => {
    mockAxios.reset();
  });

  test('createUser', async () => {
    const result:Promise<boolean> = keystore.createUser(username, password);
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

  test('deleteUser', async () => {
    const result:Promise<boolean> = keystore.deleteUser(username, password);
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

  test('exportUser', async () => {
    const data = 'data';

    const result:Promise<string> = keystore.exportUser(username, password);
    const payload:object = {
      result: {
        user: data,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(data);
  });

  test('importUser', async () => {
    const result:Promise<boolean> = keystore.importUser(username, 'data', password);
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

  test('listUsers', async () => {
    const accounts = ['acc1', 'acc2'];

    const result:Promise<Array<string>> = keystore.listUsers();
    const payload:object = {
      result: {
        users: accounts,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:Array<string> = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(accounts);
  });
});
