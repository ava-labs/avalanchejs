import { concatBytes } from '@noble/hashes/utils';
import { Codec } from '../../codec/codec';
import { Serializable, serializable } from '../../common/types';
import { UTXOID } from '../../components/avax';
import { Id } from '../../fxs/common';
import { packSimpleWithCodec, unpack } from '../../utils/struct';

const _symbol = Symbol('avax.Utxo');

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-Exporttx
 */
@serializable()
export class Utxo {
  _type = _symbol;

  constructor(
    public utxoId: UTXOID,
    public assetId: Id,
    public output: Serializable,
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
      packSimpleWithCodec([this.utxoId, this.assetId], codec),
      codec.PackPrefix(this.output),
    );
  }

  ID() {
    return this.utxoId.ID();
  }
}
