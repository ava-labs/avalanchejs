import mockAxios from 'jest-mock-axios';
import { Avalanche } from 'src';
import { IndexAPI } from 'src/apis/index/api';

describe('Index', () => {
  const ip: string = '127.0.0.1';
  const port: number = 9650;
  const protocol: string = 'https';

  const avalanche: Avalanche = new Avalanche(ip, port, protocol, 12345);
  let index: IndexAPI;

  let testEndpoints:Array<string> = ["/ext/opt/bin/bash/foo", "/dev/null", "/tmp"];
  let encoding: string = 'cb58';

  beforeAll(() => {
    index = avalanche.Index();
  });

  afterEach(() => {
    mockAxios.reset();
  });

  test('getLastAccepted', async () => {
    const result = await index.getLastAccepted(encoding);
    console.log(result)

    // const payload:object = {
    //   result: {
    //     token: testToken,
    //   },
    // };
    // const responseObj = {
    //   data: payload,
    // };

    // mockAxios.mockResponse(responseObj);
    // const response:string = await result;

    // expect(mockAxios.request).toHaveBeenCalledTimes(1);
    // expect(response).toBe(testToken);
  });
});
