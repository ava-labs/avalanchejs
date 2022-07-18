import { concatBytes } from '../../utils/buffer';
import { packList, toListStruct } from '../../utils/serializeList';
import { pack, unpack } from '../../utils/struct';
import { BaseTx, TransferableOutput } from '../avax';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { Id } from '../fxs/common';
import { AVMTx } from './abstractTx';

const _symbol = Symbol('avm.ExportTx');

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-Exporttx
 */
@serializable()
export class ExportTx extends AVMTx {
  _type = _symbol;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly destination: Id,
    public readonly outs: TransferableOutput[],
  ) {
    super();
  }

  static fromBytes(bytes: Uint8Array, codec: Codec): [ExportTx, Uint8Array] {
    const [baseTx, sourceChain, outs, remaining] = unpack(
      bytes,
      [BaseTx, Id, toListStruct(TransferableOutput)],
      codec,
    );
    return [new ExportTx(baseTx, sourceChain, outs), remaining];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.baseTx, this.destination], codec),
      packList(this.outs, codec),
    );
  }
}
