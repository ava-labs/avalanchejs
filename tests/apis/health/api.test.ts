import mockAxios from 'jest-mock-axios';

import { Avalanche } from 'src';
import BinTools from 'src/utils/bintools';
import { HealthAPI } from 'src/apis/health/api';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

describe('Health', () => {
  const ip = '127.0.0.1';
  const port = 9650;
  const protocol = 'https';

  const avalanche = new Avalanche(ip, port, protocol, 12345, undefined, undefined, undefined, true);
  let health:HealthAPI;

  beforeAll(() => {
    health = new HealthAPI(avalanche);
  });

  afterEach(() => {
    mockAxios.reset();
  });

  test('getLiveness ', async () => {
    const result:Promise<object> = health.getLiveness();
    const payload:any = {
      result: {
        checks: {
          'network.validators.heartbeat': {
            message: {
              heartbeat: 1591041377,
            },
            timestamp: '2020-06-01T15:56:18.554202-04:00',
            duration: 23201,
            contiguousFailures: 0,
            timeOfFirstFailure: null,
          },
        },
        healthy: true,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:any = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(payload.result);
  });
});
