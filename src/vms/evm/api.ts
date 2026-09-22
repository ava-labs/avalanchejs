import { SignedTx } from '../../serializable/avax';
import { getEVMManager } from '../../serializable/evm/codec';
import { hexToBuffer } from '../../utils';
import { Api } from '../common/baseApi';
import { ChainApi } from '../common/chainAPI';
import type { GetAtomicTxParams, GetAtomicTxStatusResponse } from './model';
import type { GetAtomicTxServerResponse } from './privateModels';
import { requireNonNegativeBigInt } from '../../utils/nodeFees';

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

  /**
   * The C-chain base fee, as reported by the node.
   *
   * Unit: **wei**. The atomic-tx builders
   * (`newExportTxFromBaseFee`/`newImportTxFromBaseFee`) expect **nAVAX**, so
   * callers must divide by 1e9 before passing it on — see
   * `examples/c-chain/export.ts`. A missed conversion multiplies the burn by
   * 1e9. The value is multiplied straight into the amount debited from the
   * caller's C-chain account, so bound it with the builders' `maxFee`.
   */
  async getBaseFee() {
    return requireNonNegativeBigInt(
      await this.callRpc<string>('eth_baseFee'),
      'eth_baseFee',
    );
  }
}
