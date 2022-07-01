import type { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import { BaseTx, TransferableInput } from '../../components/avax';
import { Id } from '../../fxs/common';
import { concatBytes } from '../../utils/buffer';
import { packList, toListStruct } from '../../utils/serializeList';
import { pack, unpack } from '../../utils/struct';

const _symbol = Symbol('avm.ImportTx');

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-importtx
 */
@serializable()
export class ImportTx {
  _type = _symbol;

  constructor(
    private baseTx: BaseTx,
    private sourceChain: Id,
    private ins: TransferableInput[],
  ) {}

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
