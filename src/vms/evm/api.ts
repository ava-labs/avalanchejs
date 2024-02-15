import { SignedTx } from '../../serializable/avax';
import { getEVMManager } from '../../serializable/evm/codec';
import { hexToBuffer } from '../../utils';
import { Api } from '../common/baseApi';
import { ChainApi } from '../common/chainAPI';
import type { GetAtomicTxParams, GetAtomicTxStatusResponse } from './model';
import type { GetAtomicTxServerResponse } from './privateModels';

export class EVMApi extends ChainApi {
  ethAPI: EthereumAPI;
  constructor(baseURL?: string) {
    super(baseURL, '/ext/bc/C/avax', 'avax', getEVMManager());
    this.ethAPI = new EthereumAPI(baseURL);
  }

  /**
   * Returns the transaction data of a provided transaction ID by calling the node's `getAtomicTx` method.
   *
   * @param txID The string representation of the transaction ID
   *
   * @returns Returns a Promise with the signedTX unmarshalled from the bytes
   */

  getAtomicTx = async (getTxParams: GetAtomicTxParams) => {
    const resp = await this.callRpc<GetAtomicTxServerResponse>('getAtomicTx', {
      ...getTxParams,
      encoding: 'hex',
    });
    return this.manager.unpack(hexToBuffer(resp.tx), SignedTx);
  };

  /**
   * @returns a Promise string containing the base fee for the next block.
   */
  getBaseFee() {
    return this.ethAPI.getBaseFee();
  }

  /**
   * Returns the status of a provided atomic transaction ID by calling the node's `getAtomicTxStatus` method.
   *
   * @param txID The string representation of the transaction ID
   *
   * @returns Returns a Promise {status: string, blockHeight: string} containing the status retrieved from the node
   */

  getAtomicTxStatus(txID: string): Promise<GetAtomicTxStatusResponse> {
    return this.callRpc<GetAtomicTxStatusResponse>('getAtomicTxStatus', {
      txID,
    });
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
