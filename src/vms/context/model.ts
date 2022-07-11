export type Context = {
  readonly networkID: number;
  readonly hrp: string;
  readonly xBlockchainID: string;
  readonly pBlockchainID: string;
  readonly cBlockchainID: string;
  readonly avaxAssetID: string;
  readonly baseTxFee: bigint;
  readonly createAssetTxFee: bigint;
  readonly createSubnetTxFee: bigint;
  readonly createBlockchainTxFee: bigint;
};
