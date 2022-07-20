import { getEVMManager } from '../../serializable/evm/codec';
import { Api } from '../common/api';
import type { GetUTXOResponse, GetUTXOsInput } from '../common/apiModels';

export class EVMApi extends Api {
  constructor(baseURL?: string) {
    super(baseURL, '/ext/bc/C/avax', 'platform');
  }

  async getUTXOs(input: GetUTXOsInput): Promise<GetUTXOResponse> {
    return this.getUTXOsForManager(input, getEVMManager());
  }
}
