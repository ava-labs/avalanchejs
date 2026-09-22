import { getAVMManager } from '../../serializable/avm/codec';
import { AvaxApi } from '../common/avaxApi';
import { requireNonNegativeBigInt } from '../../utils/nodeFees';
import type {
  BuildGenesisParams,
  BuildGenesisResponse,
  GetAllBalancesParams,
  GetAllBalancesResponse,
  GetTxFeeResponse,
  TxFee,
} from './models';

export class AVMApi extends AvaxApi {
  constructor(baseURL?: string) {
    super(baseURL, '/ext/bc/X', 'avm', getAVMManager());
  }

  /**
   * Given a JSON representation of this Virtual Machine’s genesis state, create the byte representation of that state.
   *
   * @param genesisData The blockchain's genesis data object
   *
   * @returns Promise of a string of bytes
   */
  buildGenesis = async (
    params: BuildGenesisParams,
  ): Promise<BuildGenesisResponse> => {
    return await this.callRpc<BuildGenesisResponse>('buildGenesis', params);
  };

  getAllBalances(
    getAllBalancesParams: GetAllBalancesParams,
  ): Promise<GetAllBalancesResponse> {
    return this.callRpc<GetAllBalancesResponse>(
      'getAllBalances',
      getAllBalancesParams,
    );
  }

  /**
   * The static X-chain fees, as reported by the node.
   *
   * These are burned verbatim by the AVM builders, so a node that inflates
   * them decides how much of the caller's AVAX is destroyed. Only
   * well-formedness can be checked here; the bound that matters is
   * `SpendOptions.maxFee`, which the node does not control.
   */
  getTxFee = async (): Promise<TxFee> => {
    const txFee = await this.callRpc<GetTxFeeResponse>('getTxFee');
    return {
      txFee: requireNonNegativeBigInt(txFee.txFee, 'getTxFee.txFee'),
      createAssetTxFee: requireNonNegativeBigInt(
        txFee.createAssetTxFee,
        'getTxFee.createAssetTxFee',
      ),
    };
  };
}
