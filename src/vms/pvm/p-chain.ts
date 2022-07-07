import { getManager } from '../../serializable/pvm/codec';
import { Api } from '../common/api';
import type {
  GetAssetDescriptionResponse,
  GetUTXOResponse,
  GetUTXOsInput,
} from '../common/apiModels';

export class PVMApi extends Api {
  constructor(baseURL?: string) {
    super(baseURL, '/ext/bc/P', 'platform');
  }

  async getUTXOs(input: GetUTXOsInput): Promise<GetUTXOResponse> {
    return this.getUTXOsForManager(input, getManager());
  }

  getAssetDescription(assetID: string): Promise<GetAssetDescriptionResponse> {
    return this.callRpc<GetAssetDescriptionResponse>('getAssetDescription', {
      assetID,
    });
  }
}
