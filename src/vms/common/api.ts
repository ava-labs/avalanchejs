import { AVAX_PUBLIC_URL } from '../../constants/public-urls';
import { Utxo } from '../../serializable/avax/utxo';
import type { Manager } from '../../serializable/codec';
import { hexToBuffer } from '../../utils/buffer';
import type { GetUTXOsApiResp, GetUTXOsInput } from './apiModels';
import { JrpcProvider } from './rpc';

export abstract class Api {
  protected rpcProvider: JrpcProvider;

  constructor(
    baseURL: string = AVAX_PUBLIC_URL,
    protected path: string,
    protected base: string,
  ) {
    this.rpcProvider = new JrpcProvider(baseURL + path);
  }

  protected getMethodName = (methodName: string) =>
    `${this.base}.${methodName}`;

  protected callRpc = <T>(
    methodName: string,
    params?: Array<Record<string, any>> | Record<string, any>,
  ): Promise<T> =>
    this.rpcProvider.callMethod<T>(this.getMethodName(methodName), params);

  async getUTXOsForManager(input: GetUTXOsInput, manager: Manager) {
    const resp = await this.callRpc<GetUTXOsApiResp>('getUTXOs', {
      ...input,
      encoding: 'hex',
    });

    const utxos = resp.utxos.map((utxoHex) =>
      manager.unpackCodec(hexToBuffer(utxoHex), Utxo),
    );

    return {
      ...resp,
      utxos,
    };
  }
}
