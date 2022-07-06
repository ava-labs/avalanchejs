export type GetAssetDescriptionResponse = {
  assetId: string;
  name: string;
  symbol: string;
  denomination: number;
};

export type PVMContext = {
  readonly networkID: number;
  readonly hrp: string;
  readonly avaxAssetID: string;
  readonly baseTxFee: bigint;
  readonly createSubnetTxFee: bigint;
  readonly createBlockchainTxFee: bigint;
};
