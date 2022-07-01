import type { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import { BaseTx } from '../../components/avax';
import { TransferableOp } from '../../components/avax/transferableOp';
import { concatBytes } from '../../utils/buffer';
import { packList, toListStruct } from '../../utils/serializeList';
import { unpack } from '../../utils/struct';

const _symbol = Symbol('avm.OperationTx');

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-OperationTx
 */
@serializable()
export class OperationTx {
  _type = _symbol;

  constructor(private baseTx: BaseTx, private ops: TransferableOp[]) {}

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
