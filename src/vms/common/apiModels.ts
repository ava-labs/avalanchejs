import type { Utxo } from '../../serializable/avax/utxo';

export type GetUTXOsInput = {
  addresses: string[];
  limit?: number;
  startIndex?: {
    address: string;
    utxo: string;
  };
  sourceChain?: string;
};

export type GetUTXOsApiResp = {
  numFetched: number;
  utxos: string[];
  endIndex: {
    address: string;
    utxo: string;
  };
  sourceChain?: string;
  encoding: string;
};

export type GetUTXOResponse = Omit<GetUTXOsApiResp, 'utxos'> & {
  utxos: Utxo[];
};

export type GetAssetDescriptionResponse = {
  assetID: string;
  name: string;
  symbol: string;
  denomination: number;
};

export type AVMContext = {
  readonly networkID: number;
  readonly hrp: string;
  readonly blockchainID: string;
  readonly avaxAssetID: string;
  readonly baseTxFee: bigint;
  readonly createAssetTxFee: bigint;
};

export interface IssueTxParams {
  tx: string;
}

export interface IssueTxResponse {
  txID: string;
}

export interface GetTxParams {
  txID: string;
}

export interface GetTxStatusParams {
  txID: string;
  includeReason?: boolean | true;
}

export interface GetTxStatusResponse {
  status: string;
  reason: string;
}
