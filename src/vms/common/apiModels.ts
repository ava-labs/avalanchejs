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
  assetId: string;
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
