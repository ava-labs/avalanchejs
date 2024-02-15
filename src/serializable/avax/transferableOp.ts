import { concatBytes } from '../../utils/buffer';
import { packList, toListStruct } from '../../utils/serializeList';
import { pack, unpack } from '../../utils/struct';
import { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { Id } from '../fxs/common/id';
import { UTXOID } from './utxoId';
import { TypeSymbols } from '../constants';

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#transferable-op
 */
@serializable()
export class TransferableOp {
  _type = TypeSymbols.TransferableOp;

  constructor(
    private readonly assetId: Id,
    private readonly UTXOId: UTXOID[],
    private readonly transferOp: Serializable,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [TransferableOp, Uint8Array] {
    const [assetId, utxoID, transferOp, remaining] = unpack(
      bytes,
      [Id, toListStruct(UTXOID), Codec],
      codec,
    );

    return [new TransferableOp(assetId, utxoID, transferOp), remaining];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.assetId], codec),
      packList(this.UTXOId, codec),
      codec.PackPrefix(this.transferOp),
    );
  }
}
