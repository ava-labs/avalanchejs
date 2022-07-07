import { concatBytes } from '@noble/hashes/utils';
import { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { UTXOID } from '.';
import { Id } from '../fxs/common';
import { pack, unpack } from '../../utils/struct';

const _symbol = Symbol('avax.Utxo');

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-Exporttx
 */
@serializable()
export class Utxo {
  _type = _symbol;

  constructor(
    public readonly utxoId: UTXOID,
    public readonly assetId: Id,
    public readonly output: Serializable,
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [Utxo, Uint8Array] {
    const [utxoId, assetId, output, remaining] = unpack(
      bytes,
      [UTXOID, Id, Codec],
      codec,
    );
    return [new Utxo(utxoId, assetId, output), remaining];
  }

  toBytes(codec) {
    return concatBytes(
      pack([this.utxoId, this.assetId], codec),
      codec.PackPrefix(this.output),
    );
  }

  ID() {
    return this.utxoId.ID();
  }
}
