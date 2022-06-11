import { merge } from '../../utils/buffer';
import type { Codec } from '../../codec/codec';
import { Newable, NewableStatic, staticImplements } from '../../common/types';
import { configs, pack, unpack } from '../../utils/struct';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/components/avax/transferables.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization#transferable-input
 * @see https://docs.avax.network/specs/avm-transaction-serialization#transferable-input
 * @see https://docs.avax.network/specs/platform-transaction-serialization#transferable-input
 */
@staticImplements<NewableStatic>()
export class TransferableInput {
  id = 'avax.TransferableInput';

  constructor(
    private txId: string,
    private utxoIdx: number,
    private assetId: string,
    private input: Newable,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [TransferableInput, Uint8Array] {
    let txId: string;
    let utxoIdx: number;
    let assetId: string;
    [txId, utxoIdx, assetId, bytes] = unpack<[string, number, string]>(bytes, [
      configs.id,
      configs.int,
      configs.id,
    ]);

    let input: Newable;
    [input, bytes] = codec.UnpackPrefix(bytes);

    return [new TransferableInput(txId, utxoIdx, assetId, input), bytes];
  }

  toBytes(codec: Codec) {
    return merge([
      pack([
        [this.txId, configs.id],
        [this.utxoIdx, configs.int],
        [this.assetId, configs.id],
      ]),
      codec.PackPrefix(this.input),
    ]);
  }
}
