export interface BuildGenesisParams {
  genesisData: object;
}

export interface BuildGenesisResponse {
  bytes: string;
  encoding: string;
}

export interface GetAddressTxsParams {
  address: string;
  cursor?: bigint;
  assetID: string;
  pageSize?: bigint;
}

export interface GetAddressTxsResponse {
  txIDs: string[];
  cursor: bigint;
}

export interface GetTxFeeResponse {
  txFee: string;
  createAssetTxFee: string;
}

export interface TxFee {
  txFee: bigint;
  createAssetTxFee: bigint;
}
