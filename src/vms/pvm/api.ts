import { TransferableOutput } from '../../serializable/avax';
import { Utxo } from '../../serializable/avax/utxo';
import { getPVMManager } from '../../serializable/pvm/codec';
import { hexToBuffer } from '../../utils';
import type { GetAssetDescriptionResponse } from '../common/apiModels';
import { AvaxApi } from '../common/avaxApi';
import type {
  GetCurrentSupplyResponse,
  GetCurrentValidatorsParams,
  GetCurrentValidatorsResponse,
  GetMaxStakeAmountParams,
  GetPendingValidatorsParams,
  GetPendingValidatorsResponse,
  GetRewardUTXOsParams,
  GetRewardUTXOsResponse,
  GetStakeParams,
  GetStakeResponse,
  GetTxStatusParams,
  GetTxStatusResponse,
  GetValidatorsAtParams,
  GetValidatorsAtResponse,
} from './models';
import type {
  GetRewardUTXOsServerResponse,
  GetStakeServerResponse,
} from './privateModels';

export class PVMApi extends AvaxApi {
  constructor(baseURL?: string) {
    super(baseURL, '/ext/bc/P', 'platform', getPVMManager());
  }

  getAssetDescription(assetID: string): Promise<GetAssetDescriptionResponse> {
    return this.callRpc<GetAssetDescriptionResponse>('getAssetDescription', {
      assetID,
    });
  }

  getCurrentValidators(
    getCurrentValidatorsParams?: GetCurrentValidatorsParams,
  ): Promise<GetCurrentValidatorsResponse> {
    return this.callRpc<GetCurrentValidatorsResponse>(
      'getCurrentValidators',
      getCurrentValidatorsParams,
    );
  }
  getPendingValidators(
    getPendingValidatorsParams?: GetPendingValidatorsParams,
  ): Promise<GetPendingValidatorsResponse> {
    return this.callRpc<GetPendingValidatorsResponse>(
      'getPendingValidators',
      getPendingValidatorsParams,
    );
  }

  async getRewardUTXOs(
    getRewardUTXOsParams: GetRewardUTXOsParams,
  ): Promise<GetRewardUTXOsResponse> {
    const resp = await this.callRpc<GetRewardUTXOsServerResponse>(
      'getRewardUTXOs',
      getRewardUTXOsParams,
    );
    return {
      ...resp,
      utxos: resp.utxos.map((bytes) =>
        getPVMManager().unpack(hexToBuffer(bytes), Utxo),
      ),
    };
  }

  async getStake(getStakeParams: GetStakeParams): Promise<GetStakeResponse> {
    const resp = await this.callRpc<GetStakeServerResponse>(
      'getStake',
      getStakeParams,
    );
    return {
      ...resp,
      stakedOutputs: resp.stakedOutputs.map((bytes) =>
        getPVMManager().unpack(hexToBuffer(bytes), TransferableOutput),
      ),
    };
  }

  getValidatorsAt(
    getValidatorsAtParams: GetValidatorsAtParams,
  ): Promise<GetValidatorsAtResponse> {
    return this.callRpc<GetValidatorsAtResponse>(
      'getValidatorsAt',
      getValidatorsAtParams,
    );
  }

  getCurrentSupply(): Promise<GetCurrentSupplyResponse> {
    return this.callRpc<GetCurrentSupplyResponse>('getCurrentSupply');
  }

  getMaxStakeAmount(
    getMaxStakeAmountParams: GetMaxStakeAmountParams,
  ): Promise<GetMaxStakeAmountParams> {
    return this.callRpc<GetMaxStakeAmountParams>(
      'getMaxStakeAmount',
      getMaxStakeAmountParams,
    );
  }

  getTxStatus(getTxStatus: GetTxStatusParams): Promise<GetTxStatusResponse> {
    return this.callRpc<GetTxStatusResponse>('getTxStatus', {
      includeReason: true,
      ...getTxStatus,
    });
  }
}
