import { concatBytes } from '@noble/hashes/utils';
import type { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import { BaseTx, TransferableInput } from '../../components/avax';
import { Id } from '../../fxs/common';
import { convertListStruct, packList } from '../../utils/serializeList';
import { packSimpleWithCodec, unpack } from '../../utils/struct';

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-importtx
 */
@serializable()
export class ImportTx {
  id = 'avax.ImportTx';

  constructor(
    private baseTx: BaseTx,
    private sourceChain: Id,
    private ins: TransferableInput[],
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [ImportTx, Uint8Array] {
    const [baseTx, sourceChain, ins, remaining] = unpack(
      bytes,
      [BaseTx, Id, convertListStruct(TransferableInput)],
      codec,
    );
    return [new ImportTx(baseTx, sourceChain, ins), remaining];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      packSimpleWithCodec([this.baseTx, this.sourceChain], codec),
      packList(this.ins, codec),
    );
  }
}
