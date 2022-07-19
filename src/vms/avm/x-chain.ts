import { getAVMManager } from '../../serializable/avm/codec';
import { Api } from '../common/api';
import type {
  GetAssetDescriptionResponse,
  GetUTXOResponse,
  GetUTXOsInput,
} from '../common/apiModels';

export class AVMApi extends Api {
  constructor(baseURL?: string) {
    super(baseURL, '/ext/bc/X', 'avm');
  }

  async getUTXOs(input: GetUTXOsInput): Promise<GetUTXOResponse> {
    return this.getUTXOsForManager(input, getAVMManager());
  }

  getAssetDescription(assetID: string): Promise<GetAssetDescriptionResponse> {
    return this.callRpc<GetAssetDescriptionResponse>('getAssetDescription', {
      assetID,
    });
  }
}
