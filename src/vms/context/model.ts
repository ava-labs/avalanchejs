import type { FeeConfig } from '../pvm';

export type Context = {
  readonly networkID: number;
  readonly hrp: string;
  readonly xBlockchainID: string;
  readonly pBlockchainID: string;
  readonly cBlockchainID: string;
  readonly avaxAssetID: string;
  readonly baseTxFee: bigint;
  readonly createAssetTxFee: bigint;

  // Post Etna
  readonly platformFeeConfig: FeeConfig;
};
