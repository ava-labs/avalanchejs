import { JrpcProvider } from '../common/rpc';
import { Utxo } from '../components/avax/utxo';
import {
  MAINNET_PUBLIC_API_BASE_URL,
  X_CHAIN_ENDPOINT,
} from '../constants/endpoints';
import { hexToBuffer } from '../utils/buffer';
import { getManager } from '../vms/avm/codec';
import type { getUTXOOutput, getUTXOsInput, getUTXOsResp } from './models';

export class XChain {
  private rpcProvider: JrpcProvider;

  constructor(baseURL: string = MAINNET_PUBLIC_API_BASE_URL) {
    this.rpcProvider = new JrpcProvider(`${baseURL}${X_CHAIN_ENDPOINT}`);
  }

  async getUTXOs(input: getUTXOsInput): Promise<getUTXOOutput> {
    const resp = await this.rpcProvider.callMethod<getUTXOsResp>(
      'avm.getUTXOs',
      { ...input, encoding: 'hex' },
    );

    const manager = getManager();

    const utxos = resp.utxos.map((utxoHex) =>
      manager.unpackCodec(hexToBuffer(utxoHex), Utxo),
    );

    return {
      ...resp,
      utxos,
    };
  }
}
