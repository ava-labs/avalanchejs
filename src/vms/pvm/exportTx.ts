import type { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import { BaseTx, TransferableOutput } from '../../components/avax';
import { Id } from '../../fxs/common';
import { toListStruct } from '../../utils/serializeList';
import { packSwitched, unpack } from '../../utils/struct';

const _symbol = Symbol('pvm.ExportTx');

/**
 * @see
 */
@serializable()
export class ExportTx {
  _type = _symbol;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly id: Id,
    public readonly outs: TransferableOutput[],
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [ExportTx, Uint8Array] {
    const [baseTx, id, outs, rest] = unpack(
      bytes,
      [BaseTx, Id, toListStruct(TransferableOutput)],
      codec,
    );
    return [new ExportTx(baseTx, id, outs), rest];
  }

  toBytes(codec: Codec) {
    return packSwitched(codec, this.baseTx, this.id, this.outs);
  }
}
