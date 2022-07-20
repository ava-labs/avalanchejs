import type { TransferableOutput } from '../../serializable/avax';
import type { Utxo } from '../../serializable/avax/utxo';

export type GetAssetDescriptionResponse = {
  assetId: string;
  name: string;
  symbol: string;
  denomination: number;
};

export type GetCurrentValidatorsResponse = {
  validators: {
    txID: string;
    startTime: string;
    endTime: string;
    stakeAmount: string;
    nodeID: string;
    weight: string;
    rewardOwner: {
      locktime: string;
      threshold: string;
      addresses: string[];
    };
    potentialReward: string;
    delegationFee: string;
    uptime: string;
    connected: boolean;
    delegators: {
      txID: string;
      startTime: string;
      endTime: string;
      stakeAmount: string;
      nodeID: string;
      rewardOwner: {
        locktime: string;
        threshold: string;
        addresses: string[];
      };
      potentialReward: string;
    }[];
  }[];
};

export type GetPendingValidatorsParams = {
  subnetID?: string;
  nodeIDs?: string[];
};

export type GetPendingValidatorsResponse = {
  validators: {
    txID: string;
    startTime: string;
    endTime: string;
    stakeAmount: string;
    nodeID: string;
    delegationFee: string;
    connected: boolean;
    weight: string;
  }[];
  delegators: {
    txID: string;
    startTime: string;
    endTime: string;
    stakeAmount: string;
    nodeID: string;
  }[];
};

export interface GetRewardUTXOsParams {
  txID: string;
}

export interface GetRewardUTXOsResponse {
  numFetched: number;
  utxos: Utxo[];
}

export interface GetStakeParams {
  addresses: string[];
}

export interface GetStakeResponse {
  staked: bigint;
  stakedOutputs: TransferableOutput[];
}

export interface GetRewardUTXOsParams {
  txID: string;
}

export interface GetRewardUTXOsResponse {
  numFetched: number;
  utxos: Utxo[];
}

export interface GetValidatorsAtParams {
  height: number;
  subnetID?: string;
}

export interface GetValidatorsAtResponse {
  validators: object;
}

export interface GetCurrentValidatorsParams {
  subnetID?: Buffer | string;
  nodeIDs?: string[];
}

export interface SampleValidatorsParams {
  size: number;
  subnetID?: string;
}

export interface GetBalanceResponse {
  balance: bigint;
  unlocked: bigint;
  lockedStakeable: bigint;
  lockedNotStakeable: bigint;
  utxoIDs: {
    txID: string;
    outputIndex: number;
  }[];
}

export interface StartIndex {
  address: string;
  utxo: string;
}

export interface Subnet {
  ids: string;
  controlKeys: string[];
  threshold: number;
}

export interface Blockchain {
  id: string;
  name: string;
  subnetID: string;
  vmID: string;
}

export interface GetTxStatusParams {
  txID: string;
  includeReason?: boolean | true;
}

export interface GetTxStatusResponse {
  status: string;
  reason: string;
}

export interface GetMinStakeResponse {
  minValidatorStake: bigint;
  minDelegatorStake: bigint;
}

export interface GetMaxStakeAmountParams {
  subnetID?: string;
  nodeID: string;
  startTime: bigint;
  endTime: bigint;
}

export interface IssueTxParams {
  tx: string;
}

export interface IssueTxResponse {
  txID: string;
}

export interface GetTxStatusParams {
  txID: string;
  includeReason?: boolean;
}

export interface GetTxStatusResponse {
  status: string;
  reason: string;
}
