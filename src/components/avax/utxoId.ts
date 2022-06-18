import { serializable } from '../../common/types';
import { Id } from '../../fxs/common/id';
import { Int } from '../../primatives/int';
import { packSimple, unpack } from '../../utils/struct';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/components/avax/utxo_id.go
 */
@serializable()
export class UTXOID {
  id = 'avax.UTXOID';

  constructor(private txID: Id, private outputIdx: Int) {}

  static fromBytes(bytes: Uint8Array): [UTXOID, Uint8Array] {
    const [txID, outputIdx, remaining] = unpack(bytes, [Id, Int]);

    return [new UTXOID(txID, outputIdx), remaining];
  }

  toBytes() {
    return packSimple(this.txID, this.outputIdx);
  }
}
