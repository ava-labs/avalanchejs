import type { Codec } from '../../serializable/codec';
import type { VM } from '../../serializable/constants';

export abstract class Transaction {
  abstract _type: symbol;
  abstract toBytes(codec: Codec): Uint8Array;
  abstract vm: VM;
  abstract getBlockchainId(): string;

  getVM() {
    return this.vm;
  }
}
