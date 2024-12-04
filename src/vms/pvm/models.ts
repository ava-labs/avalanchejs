import type { PChainOwner } from '../../serializable';
import type { TransferableOutput } from '../../serializable/avax';
import type { Utxo } from '../../serializable/avax/utxo';
import type { Dimensions } from '../common/fees/dimensions';

export type GetAssetDescriptionResponse = {
  assetId: string;
  name: string;
  symbol: string;
  denomination: number;
};

// https://docs.avax.network/api-reference/p-chain/api#platformgetcurrentvalidators
export type GetCurrentValidatorsResponse = {
  validators: {
    accruedDelegateeReward: string;
    txID: string;
    startTime: string;
    endTime: string;
    stakeAmount: string;
    nodeID: string;
    weight: string;
    validationRewardOwner: {
      locktime: string;
      threshold: string;
      addresses: string[];
    };
    delegationRewardOwner: {
      locktime: string;
      threshold: string;
      addresses: string[];
    };
    signer: {
      publicKey: string;
      proofOfPosession: string;
    };
    delegatorCount: string;
    delegatorWeight: string;
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

// https://docs.avax.network/api-reference/p-chain/api#platformgetpendingvalidators
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
    signer: {
      publicKey: string;
      proofOfPosession: string;
    };
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

export interface SampleValidatorsResponse {
  validators: string[];
}

export interface GetBalanceParams {
  addresses: string[];
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

export interface GetTxStatusParams {
  txID: string;
  includeReason?: boolean;
}

export interface GetTxStatusResponse {
  status: string;
  reason: string;
}

export interface GetCurrentSupplyResponse {
  supply: bigint;
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

export interface GetBlockchainsResponse {
  blockchains: {
    id: string;
    name: string;
    subnetID: string;
    vmID: string;
  }[];
}

export interface GetBlockchainStatusResponse {
  status: string;
}

export interface GetHeightResponse {
  height: number;
}

export interface GetStakingAssetIDParams {
  subnetID: string;
}

export interface GetStakingAssetIDResponse {
  assetID: string;
}

export interface GetSubnetParams {
  subnetID: string;
}

export interface GetSubnetResponse {
  isPermissioned: boolean;
  controlKeys: string[];
  threshold: string;
  locktime: string;
  subnetTransformationTxID: string;
  conversionID: string;
  managerChainID: string;
  managerAddress: string | null;
}

export interface GetSubnetsParams {
  ids: string[];
}

export interface GetSubnetsResponse {
  subnets: {
    id: string;
    controlKeys: string[];
    threshold: string;
  }[];
}

export interface GetTimestampResponse {
  timestamp: string;
}

export interface GetTotalStakeResponse {
  weight: string;
}

export interface ValidatedByParams {
  blockchainID: string;
}

export interface ValidatedByResponse {
  subnetID: string;
}

export interface ValidatesParams {
  subnetID: string;
}

export interface ValidatesResponse {
  blockchainIDs: string[];
}

export interface FeeConfigResponse {
  weights: [
    bandwidth: number,
    dbRead: number,
    dbWrite: number,
    compute: number,
  ]; // Weights to merge fee dimensions into a single gas value.
  maxCapacity: number; // Maximum amount of gas the chain is allowed to store for future use.
  maxPerSecond: number; // Maximum amount of gas the chain is allowed to consume per second.
  targetPerSecond: number; // Target amount of gas the chain should consume per second to keep the fees stable.
  minPrice: number; // Minimum price per unit of gas.
  excessConversionConstant: number; // Constant used to convert excess gas to a gas price.
}

export interface FeeConfig {
  weights: Dimensions;
  maxCapacity: bigint;
  maxPerSecond: bigint;
  targetPerSecond: bigint;
  /** Minimum gas price */
  minPrice: bigint;
  excessConversionConstant: bigint;
}

export interface FeeStateResponse {
  capacity: number;
  excess: number;
  price: number;
  timestamp: string;
}

export interface FeeState {
  capacity: bigint;
  excess: bigint;
  /** Price to use for dynamic fee calculation */
  price: bigint;
  /** ISO8601 DateTime */
  timestamp: string;
}

export interface GetL1ValidatorResponse {
  subnetID: string;
  nodeID: string;
  publicKey: string;
  remainingBalanceOwner: {
    addresses: string[];
    locktime: string;
    threshold: string;
  };
  deactivationOwner: {
    addresses: string[];
    locktime: string;
    threshold: string;
  };
  startTime: string;
  weight: string;
  minNonce: string;
  balance: string;
  height: string;
}

export interface L1ValidatorDetails {
  subnetID: string;
  nodeID: string;
  publicKey: string;
  remainingBalanceOwner: PChainOwner;
  deactivationOwner: PChainOwner;
  weight: bigint;
  balance: bigint;
  startTime: bigint;
  minNonce: bigint;
  height: bigint;
}
