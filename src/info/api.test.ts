import { afterEach, describe, expect, it, vi } from 'vitest';
import { InfoApi } from './api';

describe('InfoApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('isBootstrapped calls info.isBootstrapped', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        jsonrpc: '2.0',
        id: 0,
        result: { isBootstrapped: true },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const resp = await new InfoApi('http://localhost:9650').isBootstrapped('X');

    expect(resp).toEqual({ isBootstrapped: true });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toEqual('http://localhost:9650/ext/info');
    const body = JSON.parse(init.body);
    expect(body.method).toEqual('info.isBootstrapped');
    expect(body.params).toEqual({ chain: 'X' });
  });
});
