import type { SignedTx } from '../../serializable/avax';

export interface GetAtomicTxParams {
  txID: string;
}

export interface GetAtomicTxResponse {
  tx: SignedTx;
  encoding: string;
  // Omitted by pre-Helicon nodes while the tx is still processing
  blockHeight?: bigint;
}

export interface GetAtomicTxStatusResponse {
  status: string;
  // Omitted when the status is not Accepted
  blockHeight?: string;
}
