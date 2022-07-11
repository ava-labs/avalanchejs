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
