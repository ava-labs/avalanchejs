import { concatBytes } from '../../utils/buffer';
import { packList, toListStruct } from '../../utils/serializeList';
import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import { TransferableInput } from '../avax/transferableInput';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { Id } from '../fxs/common';
import { AVMTx } from './abstractTx';
import { TypeSymbols } from '../constants';

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-importtx
 */
@serializable()
export class ImportTx extends AVMTx {
  _type = TypeSymbols.AvmImportTx;

  constructor(
    readonly baseTx: BaseTx,
    readonly sourceChain: Id,
    readonly ins: TransferableInput[],
  ) {
    super();
  }

  getSigIndices() {
    return this.ins
      .map((inp) => inp.sigIndicies())
      .concat(super.getSigIndices());
  }

  static fromBytes(bytes: Uint8Array, codec: Codec): [ImportTx, Uint8Array] {
    const [baseTx, sourceChain, ins, remaining] = unpack(
      bytes,
      [BaseTx, Id, toListStruct(TransferableInput)],
      codec,
    );
    return [new ImportTx(baseTx, sourceChain, ins), remaining];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.baseTx, this.sourceChain], codec),
      packList(this.ins, codec),
    );
  }
}
