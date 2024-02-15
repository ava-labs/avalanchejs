import type { UtxoSet } from './UTXOSet';

export interface AssetDict {
  [assetID: string]: UtxoSet;
}
