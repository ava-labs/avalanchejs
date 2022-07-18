import type { Codec } from '../codec';
import { getManager } from './codec';

export abstract class AVMTx {
  bytes() {
    return getManager().packCodec(this);
  }
  _type = Symbol.for('');
  toBytes(codec: Codec): Uint8Array {
    throw new Error('unimplemented');
  }
}
