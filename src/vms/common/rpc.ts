export type RpcCallOptions = {
  headers?: Record<string, string>;
};

type JsonRpcSuccessResp<T> = {
  jsonrpc: string;
  result: T;
  id: number;
  error?: undefined;
};

interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

type JsonRpcErrorResp = {
  jsonrpc: string;
  id: number;
  result?: undefined;
  error: JsonRpcError;
};

export class JrpcProvider {
  private reqId = 0;

  constructor(private readonly url: string) {}

  async callMethod<T>(
    method: string,
    parameters?: Array<Record<string, any>> | Record<string, any>,
    fetchOptions?: RequestInit,
  ): Promise<T> {
    const body = {
      jsonrpc: '2.0',
      id: this.reqId++,
      method,
      params: parameters,
    };
    const resp = await fetch(this.url, {
      ...fetchOptions,
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions?.headers,
      },
    })
      .then(async (r) => {
        return r.json();
      })
      .then((data) => data as JsonRpcSuccessResp<T> | JsonRpcErrorResp);

    if (resp.error) throw new Error(resp.error.message);

    return resp.result;
  }

  // TODO: Batch RPC call
}
