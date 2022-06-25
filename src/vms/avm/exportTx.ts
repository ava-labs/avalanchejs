import { concatBytes } from '../../utils/buffer';
import type { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import { BaseTx, TransferableOutput } from '../../components/avax';
import { Id } from '../../fxs/common';
import { convertListStruct, packList } from '../../utils/serializeList';
import { packSimpleWithCodec, unpack } from '../../utils/struct';

const _symbol = Symbol('avm.ExportTx');

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-Exporttx
 */
@serializable()
export class ExportTx {
  _type = _symbol;

  constructor(
    private baseTx: BaseTx,
    private destination: Id,
    private outs: TransferableOutput[],
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [ExportTx, Uint8Array] {
    const [baseTx, sourceChain, outs, remaining] = unpack(
      bytes,
      [BaseTx, Id, convertListStruct(TransferableOutput)],
      codec,
    );
    return [new ExportTx(baseTx, sourceChain, outs), remaining];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      packSimpleWithCodec([this.baseTx, this.destination], codec),
      packList(this.outs, codec),
    );
  }
}
