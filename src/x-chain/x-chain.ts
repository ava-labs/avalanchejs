import { JrpcProvider } from '../common/rpc';
import { Utxo } from '../components/avax/utxo';
import { X_CHAIN_PUBLIC_URL } from '../constants/public-urls';
import { hexToBuffer } from '../utils/buffer';
import { getManager } from '../vms/avm/codec';
import type { getUTXOOutput, getUTXOsInput, getUTXOsResp } from './models';

export class XChain {
  constructor(baseURL: string = X_CHAIN_PUBLIC_URL) {
    this.rpcProvider = new JrpcProvider(baseURL);
  }

  private rpcProvider: JrpcProvider;

  async getUTXOs(input: getUTXOsInput): Promise<getUTXOOutput> {
    const resp = await this.rpcProvider.callMethod<getUTXOsResp>(
      'avm.getUTXOs',
      { ...input, encoding: 'hex' },
    );
    const manager = getManager();

    const utxos = resp.utxos.map((utxoHex) => {
      return manager.unpackCodec(hexToBuffer(utxoHex), Utxo);
    });
    return {
      ...resp,
      utxos,
    };
  }
}
