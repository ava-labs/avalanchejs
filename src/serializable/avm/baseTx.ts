import { unpack } from '../../utils/struct';
import { BaseTx as AvaxBaseTx } from '../avax/baseTx';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { AVMTx } from './abstractTx';
import { TypeSymbols } from '../constants';

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-basetx
 */
@serializable()
export class BaseTx extends AVMTx {
  _type = TypeSymbols.AvmBaseTx;

  constructor(public readonly baseTx: AvaxBaseTx) {
    super();
  }

  static fromBytes(bytes: Uint8Array, codec: Codec): [BaseTx, Uint8Array] {
    const [baseTx, remaining] = unpack(bytes, [AvaxBaseTx], codec);
    return [new BaseTx(baseTx), remaining];
  }

  toBytes(codec: Codec) {
    return this.baseTx.toBytes(codec);
  }
}
