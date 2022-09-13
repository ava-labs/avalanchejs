import { toListStruct } from '../../utils/serializeList';
import { packSwitched, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import { TransferableOutput } from '../avax/transferableOutput';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { Id } from '../fxs/common';
import { PVMTx } from './abstractTx';

export const exportTx_symbol = Symbol('pvm.ExportTx');

/**
 * @see
 */
@serializable()
export class ExportTx extends PVMTx {
  _type = exportTx_symbol;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly destination: Id,
    public readonly outs: TransferableOutput[],
  ) {
    super();
  }

  static fromBytes(bytes: Uint8Array, codec: Codec): [ExportTx, Uint8Array] {
    const [baseTx, id, outs, rest] = unpack(
      bytes,
      [BaseTx, Id, toListStruct(TransferableOutput)],
      codec,
    );
    return [new ExportTx(baseTx, id, outs), rest];
  }

  toBytes(codec: Codec) {
    return packSwitched(codec, this.baseTx, this.destination, this.outs);
  }
}
