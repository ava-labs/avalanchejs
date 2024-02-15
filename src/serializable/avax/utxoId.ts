import { sha256 } from '@noble/hashes/sha256';
import { base58check } from '../../utils/base58';
import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import type { Codec } from '../codec';
import { serializable } from '../common/types';
import { Id } from '../fxs/common/id';
import { BigIntPr, Int } from '../primitives';
import { TypeSymbols } from '../constants';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/components/avax/utxo_id.go
 */
@serializable()
export class UTXOID {
  _type = TypeSymbols.UTXOID;

  constructor(public readonly txID: Id, public readonly outputIdx: Int) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [UTXOID, Uint8Array] {
    const [txID, outputIdx, remaining] = unpack(bytes, [Id, Int], codec);

    return [new UTXOID(txID, outputIdx), remaining];
  }

  static fromNative(txId: string, outputIdx: number) {
    return new UTXOID(Id.fromString(txId), new Int(outputIdx));
  }

  static compare(id1: UTXOID, id2: UTXOID) {
    const txIDRes = Id.compare(id1.txID, id2.txID);
    if (txIDRes !== 0) {
      return txIDRes;
    }
    return id1.outputIdx.value() - id2.outputIdx.value();
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
