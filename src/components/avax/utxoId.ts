import { serializable } from '../../common/types';
import { configs, pack, unpack } from '../../utils/struct';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/components/avax/utxo_id.go
 */
@serializable()
export class UTXOID {
  id = 'avax.UTXOID';

  constructor(private txID: string, private outputIdx: number) {}

  static fromBytes(bytes: Uint8Array): [UTXOID, Uint8Array] {
    let txID: string;
    let outputIdx: number;
    [txID, outputIdx, bytes] = unpack<[string, number]>(bytes, [
      configs.id,
      configs.int,
    ]);

    return [new UTXOID(txID, outputIdx), bytes];
  }

  toBytes() {
    return pack([
      [this.txID, configs.id],
      [this.outputIdx, configs.int],
    ]);
  }
}
