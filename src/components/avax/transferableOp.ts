import { concatBytes } from '@noble/hashes/utils';
import { UTXOID } from '.';
import { Codec } from '../../codec/codec';
import type { Serializable } from '../../common/types';
import { serializable } from '../../common/types';
import { Id } from '../../fxs/common/id';
import { convertListStruct, packList } from '../../utils/serializeList';
import { packSimpleWithCodec, unpack } from '../../utils/struct';

const _symbol = Symbol('avax.TransferableOp');

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#transferable-op
 */
@serializable()
export class TransferableOp {
  _type = _symbol;

  constructor(
    private assetId: Id,
    private UTXOId: UTXOID[],
    private transferOp: Serializable,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [TransferableOp, Uint8Array] {
    const [assetId, utxoID, transferOp, remaining] = unpack(
      bytes,
      [Id, convertListStruct(UTXOID), Codec],
      codec,
    );

    return [new TransferableOp(assetId, utxoID, transferOp), remaining];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      packSimpleWithCodec([this.assetId], codec),
      packList(this.UTXOId),
      codec.PackPrefix(this.transferOp),
    );
  }
}
