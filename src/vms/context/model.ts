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
  readonly transformSubnetTxFee: bigint;
  readonly createBlockchainTxFee: bigint;
  readonly addPrimaryNetworkValidatorFee: bigint;
  readonly addPrimaryNetworkDelegatorFee: bigint;
  readonly addSubnetValidatorFee: bigint;
  readonly addSubnetDelegatorFee: bigint;
};
