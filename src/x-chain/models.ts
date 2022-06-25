import type { Utxo } from '../components/avax/utxo';

export type getUTXOsInput = {
  addresses: string[];
  limit?: number;
  startIndex?: {
    address: string;
    utxo: string;
  };
  sourceChain?: string;
};

export type getUTXOsResp = {
  numFetched: number;
  utxos: string[];
  endIndex: {
    address: string;
    utxo: string;
  };
  sourceChain?: string;
  encoding: string;
};

export type getUTXOOutput = Omit<getUTXOsResp, 'utxos'> & {
  utxos: Utxo[];
};
