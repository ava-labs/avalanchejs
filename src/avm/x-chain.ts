import { Api } from '../common/api';
import { Utxo } from '../components/avax/utxo';
import { hexToBuffer } from '../utils/buffer';
import { getManager } from '../vms/avm/codec';
import type {
  GetAssetDescriptionResponse,
  GetUTXOResponse,
  GetUTXOsApiResp,
  GetUTXOsInput,
} from './models';

export class AVMApi extends Api {
  constructor(baseURL?: string) {
    super(baseURL, '/ext/bc/X', 'avm');
  }

  async getUTXOs(input: GetUTXOsInput): Promise<GetUTXOResponse> {
    const resp = await this.rpcProvider.callMethod<GetUTXOsApiResp>(
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

  getAssetDescription(assetID: string): Promise<GetAssetDescriptionResponse> {
    return this.callRpc<GetAssetDescriptionResponse>('getAssetDescription', {
      assetID,
    });
  }
}
