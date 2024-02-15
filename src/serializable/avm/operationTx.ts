import { concatBytes } from '../../utils/buffer';
import { packList, toListStruct } from '../../utils/serializeList';
import { unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import { TransferableOp } from '../avax/transferableOp';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { TypeSymbols } from '../constants';

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-OperationTx
 */
@serializable()
export class OperationTx {
  _type = TypeSymbols.OperationTx;

  constructor(
    private readonly baseTx: BaseTx,
    private readonly ops: TransferableOp[],
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [OperationTx, Uint8Array] {
    const [baseTx, ops, remaining] = unpack(
      bytes,
      [BaseTx, toListStruct(TransferableOp)],
      codec,
    );
    return [new OperationTx(baseTx, ops), remaining];
  }

  toBytes(codec: Codec) {
    return concatBytes(this.baseTx.toBytes(codec), packList(this.ops, codec));
  }
}
