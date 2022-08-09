import { SignedTx } from '../../serializable/avax';
import { getEVMManager } from '../../serializable/evm/codec';
import { hexToBuffer } from '../../utils';
import { Api } from '../common/baseApi';
import { ChainApi } from '../common/chainAPI';
import type { GetAtomicTxParams } from './model';
import type { GetAtomicTxServerResponse } from './privateModels';

export class EVMApi extends ChainApi {
  ethAPI: EthereumAPI;
  constructor(baseURL?: string) {
    super(baseURL, '/ext/bc/C/avax', 'avax', getEVMManager());
    this.ethAPI = new EthereumAPI(baseURL);
  }

  getAtomicTx = async (getTxParams: GetAtomicTxParams) => {
    const resp = await this.callRpc<GetAtomicTxServerResponse>('getAtomicTx', {
      ...getTxParams,
      encoding: 'hex',
    });
    return this.manager.unpack(hexToBuffer(resp.tx), SignedTx);
  };

  getBaseFee() {
    return this.ethAPI.getBaseFee();
  }
}

class EthereumAPI extends Api {
  constructor(baseURL?: string) {
    super(baseURL, '/ext/bc/C/rpc');
  }

  async getBaseFee() {
    return BigInt(await this.callRpc<string>('eth_baseFee'));
  }
}
