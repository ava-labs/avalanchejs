import type { Codec } from '../../serializable/codec';
import type { VM, TypeSymbols } from '../../serializable/constants';

export abstract class Transaction {
  abstract _type: TypeSymbols;
  abstract toBytes(codec: Codec): Uint8Array;
  abstract vm: VM;
  abstract getBlockchainId(): string;

  abstract getSigIndices(): number[][];

  getVM() {
    return this.vm;
  }
}
