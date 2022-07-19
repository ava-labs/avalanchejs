import type { Utxo } from '../../serializable/avax/utxo';
import { packTx } from '../../utils/packTx';
import type { Transaction } from './transaction';

export class UnsignedTx {
  constructor(readonly tx: Transaction, readonly utxos: Utxo[] = []) {}

  getInputUtxos() {
    return this.utxos;
  }

  toBytes(): Uint8Array {
    return packTx(this.tx);
  }

  getBlockchainId() {
    return this.tx.getBlockchainId();
  }

  getVM() {
    return this.tx.getVM();
  }
}
