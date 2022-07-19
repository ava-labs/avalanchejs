import { toListStruct } from '../../utils/serializeList';
import { pack, unpack } from '../../utils/struct';
import { BaseTx, TransferableInput } from '../avax';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { Id } from '../fxs/common';
import { PVMTx } from './abstractTx';

export const importTx_symbol = Symbol('pvm.ImportTx');

/**
 * @see
 */
@serializable()
export class ImportTx extends PVMTx {
  _type = importTx_symbol;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly sourceChain: Id,
    public readonly ins: TransferableInput[],
  ) {
    super();
  }

  static fromBytes(bytes: Uint8Array, codec: Codec): [ImportTx, Uint8Array] {
    const [baseTx, sourceChain, ins, rest] = unpack(
      bytes,
      [BaseTx, Id, toListStruct(TransferableInput)],
      codec,
    );
    return [new ImportTx(baseTx, sourceChain, ins), rest];
  }

  toBytes(codec: Codec) {
    return pack([this.baseTx, this.sourceChain, this.ins], codec);
  }
}
