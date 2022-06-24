import { concatBytes } from '@noble/hashes/utils';
import type { Serializable } from 'child_process';
import { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import { UTXOID } from '../../components/avax';
import { Id } from '../../fxs/common';
import { packSimpleWithCodec, unpack } from '../../utils/struct';

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-Exporttx
 */
@serializable()
export class Utxo {
  id = 'avax.Utxo';

  constructor(
    private utxoId: UTXOID,
    private assetId: Id,
    private output: Serializable,
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
}
