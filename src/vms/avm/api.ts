import { getAVMManager } from '../../serializable/avm/codec';
import { AvaxApi } from '../common/avaxApi';

export class AVMApi extends AvaxApi {
  constructor(baseURL?: string) {
    super(baseURL, '/ext/bc/X', 'avm', getAVMManager());
  }
}
