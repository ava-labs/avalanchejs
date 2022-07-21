import { SignedTx } from '../../serializable/avm';
import { getEVMManager } from '../../serializable/evm/codec';
import { hexToBuffer } from '../../utils';
import { ChainApi } from '../common/chainAPI';
import type { GetAtomicTxParams } from './model';
import type { GetAtomicTxServerResponse } from './privateModels';

export class EVMApi extends ChainApi {
  constructor(baseURL?: string) {
    super(baseURL, '/ext/bc/C/avax', 'avax', getEVMManager());
  }

  getAtomicTx = async (getTxParams: GetAtomicTxParams) => {
    const resp = await this.callRpc<GetAtomicTxServerResponse>('getAtomicTx', {
      ...getTxParams,
      encoding: 'hex',
    });
    return this.manager.unpack(hexToBuffer(resp.tx), SignedTx);
  };
}
