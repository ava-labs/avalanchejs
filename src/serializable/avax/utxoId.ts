import { sha256 } from '@noble/hashes/sha256';
import type { Codec } from '../codec';
import { serializable } from '../common/types';
import { Id } from '../fxs/common/id';
import { BigIntPr, Int } from '../primitives';
import { base58check } from '../../utils/base58';
import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';

const _symbol = Symbol('avax.UTXOID');

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/components/avax/utxo_id.go
 */
@serializable()
export class UTXOID {
  _type = _symbol;

  constructor(public readonly txID: Id, public readonly outputIdx: Int) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [UTXOID, Uint8Array] {
    const [txID, outputIdx, remaining] = unpack(bytes, [Id, Int], codec);

    return [new UTXOID(txID, outputIdx), remaining];
  }

  toBytes(codec) {
    return pack([this.txID, this.outputIdx], codec);
  }

  ID() {
    return base58check.encode(
      sha256(
        concatBytes(
          new BigIntPr(BigInt(this.outputIdx.value())).toBytes(),
          this.txID.toBytes(),
        ),
      ),
    );
  }
}
