import { getManager } from './codec';

export abstract class EVMTx {
  bytes() {
    return getManager().packCodec(this);
  }
  _type = Symbol.for('');
  toBytes(codec: Codec): Uint8Array {
    throw new Error('unimplemented');
  }
}
