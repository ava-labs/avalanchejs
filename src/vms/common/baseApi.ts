/* 
  this class has methods that pertain to all api sections
*/

import { AVAX_PUBLIC_URL } from '../../constants/public-urls';
import { JrpcProvider } from './rpc';

export abstract class Api {
  protected rpcProvider: JrpcProvider;

  constructor(
    baseURL: string = AVAX_PUBLIC_URL,
    protected path: string,
    protected base?: string,
    protected fetchOptions?: RequestInit,
  ) {
    this.rpcProvider = new JrpcProvider(baseURL + path);
  }

  setFetchOptions(options: RequestInit | undefined) {
    this.fetchOptions = options;
  }

  protected getMethodName = (methodName: string) => {
    if (!this.base) {
      return methodName;
    }
    return `${this.base}.${methodName}`;
  };

  protected callRpc = <T>(
    methodName: string,
    params?: Array<Record<string, any>> | Record<string, any>,
  ): Promise<T> =>
    this.rpcProvider.callMethod<T>(
      this.getMethodName(methodName),
      params,
      this.fetchOptions,
    );
}
