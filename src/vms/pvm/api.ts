import { TransferableOutput } from '../../serializable/avax';
import { Utxo } from '../../serializable/avax/utxo';
import { getPVMManager } from '../../serializable/pvm/codec';
import { hexToBuffer } from '../../utils';
import type { GetAssetDescriptionResponse } from '../common/apiModels';
import { AvaxApi } from '../common/avaxApi';
import type {
  GetBalanceParams,
  GetBalanceResponse,
  GetBlockchainsResponse,
  GetBlockchainStatusResponse,
  GetCurrentSupplyResponse,
  GetCurrentValidatorsParams,
  GetCurrentValidatorsResponse,
  GetHeightResponse,
  GetMaxStakeAmountParams,
  GetMinStakeResponse,
  GetPendingValidatorsParams,
  GetPendingValidatorsResponse,
  GetRewardUTXOsParams,
  GetRewardUTXOsResponse,
  GetStakeParams,
  GetStakeResponse,
  GetStakingAssetIDParams,
  GetStakingAssetIDResponse,
  GetSubnetsParams,
  GetSubnetsResponse,
  GetTimestampResponse,
  GetTotalStakeResponse,
  GetTxStatusParams,
  GetTxStatusResponse,
  GetValidatorsAtParams,
  GetValidatorsAtResponse,
  SampleValidatorsParams,
  SampleValidatorsResponse,
  ValidatedByParams,
  ValidatedByResponse,
  ValidatesParams,
  ValidatesResponse,
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

  /**
   * @link https://docs.avax.network/apis/avalanchego/apis/p-chain#platformgetbalance
   *
   * @param GetBalanceParams
   * @returns GetBalanceResponse
   */
  async getBalance(
    GetBalanceParams: GetBalanceParams,
  ): Promise<GetBalanceResponse> {
    const resp = await this.callRpc<{
      balance: string;
      unlocked: string;
      lockedStakeable: string;
      lockedNotStakeable: string;
      utxoIDs: {
        txID: string;
        outputIndex: number;
      }[];
    }>('getBalance', GetBalanceParams);

    return {
      balance: BigInt(resp.balance),
      unlocked: BigInt(resp.unlocked),
      lockedStakeable: BigInt(resp.lockedStakeable),
      lockedNotStakeable: BigInt(resp.lockedNotStakeable),
      utxoIDs: resp.utxoIDs,
    };
  }

  getBlockchains(): Promise<GetBlockchainsResponse> {
    return this.callRpc<GetBlockchainsResponse>('getBlockchains');
  }

  getBlockchainStatus(
    blockchainID: string,
  ): Promise<GetBlockchainStatusResponse> {
    return this.callRpc<GetBlockchainStatusResponse>('getBlockchainStatus', {
      blockchainID,
    });
  }

  getHeight(): Promise<GetHeightResponse> {
    return this.callRpc<GetHeightResponse>('getHeight');
  }

  getMinStake(): Promise<GetMinStakeResponse> {
    return this.callRpc<GetMinStakeResponse>('getMinStake');
  }

  getStakingAssetID(
    getStakingAssetIDParams: GetStakingAssetIDParams,
  ): Promise<GetStakingAssetIDResponse> {
    return this.callRpc<GetStakingAssetIDResponse>(
      'getStakingAssetID',
      getStakingAssetIDParams,
    );
  }

  getSubnets(getSubnetsParams: GetSubnetsParams): Promise<GetSubnetsResponse> {
    return this.callRpc<GetSubnetsResponse>('getSubnets', getSubnetsParams);
  }

  getTimestamp(): Promise<GetTimestampResponse> {
    return this.callRpc<GetTimestampResponse>('getTimestamp');
  }

  getTotalStake(subnetID: string): Promise<GetTotalStakeResponse> {
    return this.callRpc<GetTotalStakeResponse>('getTotalStake', { subnetID });
  }

  getTxStatus(
    getTxStatusParams: GetTxStatusParams,
  ): Promise<GetTxStatusResponse> {
    return this.callRpc<GetTxStatusResponse>('getTxStatus', getTxStatusParams);
  }

  sampleValidators(
    sampleValidatorsParams: SampleValidatorsParams,
  ): Promise<SampleValidatorsResponse> {
    return this.callRpc<SampleValidatorsResponse>(
      'sampleValidators',
      sampleValidatorsParams,
    );
  }

  validatedBy(
    validatedByParams: ValidatedByParams,
  ): Promise<ValidatedByResponse> {
    return this.callRpc<ValidatedByResponse>('validatedBy', validatedByParams);
  }

  validates(validatesParams: ValidatesParams): Promise<ValidatesResponse> {
    return this.callRpc<ValidatesResponse>('validates', validatesParams);
  }
}
