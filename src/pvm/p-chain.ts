import { Api } from '../common/api';
import type {
  GetAssetDescriptionResponse,
  GetUTXOResponse,
  GetUTXOsApiResp,
  GetUTXOsInput,
} from '../common/apiModels';
import { Utxo } from '../components/avax/utxo';
import { hexToBuffer } from '../utils/buffer';
import { getManager } from '../vms/pvm/codec';

export class PVMApi extends Api {
  constructor(baseURL?: string) {
    super(baseURL, '/ext/bc/P', 'platform');
  }

  async getUTXOs(input: GetUTXOsInput): Promise<GetUTXOResponse> {
    const resp = await this.callRpc<GetUTXOsApiResp>('getUTXOs', {
      ...input,
      encoding: 'hex',
    });

    const manager = getManager();

    const utxos = resp.utxos
      .slice(1)
      .map((utxoHex, index) => manager.unpackCodec(hexToBuffer(utxoHex), Utxo));

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
