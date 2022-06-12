import { merge } from '../../utils/buffer';
import type { Codec } from '../../codec/codec';
import { Newable, NewableStatic, staticImplements } from '../../common/types';
import { configs, pack, unpack } from '../../utils/struct';
import { UTXOID } from '.';

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
    private utxoID: UTXOID,
    private assetId: string,
    private input: Newable,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [TransferableInput, Uint8Array] {
    let utxoID: UTXOID;
    [utxoID, bytes] = UTXOID.fromBytes(bytes);

    let assetId: string;
    [assetId, bytes] = unpack<[string]>(bytes, [configs.id]);

    let input: Newable;
    [input, bytes] = codec.UnpackPrefix(bytes);

    return [new TransferableInput(utxoID, assetId, input), bytes];
  }

  toBytes(codec: Codec) {
    return merge([
      this.utxoID.toBytes(),
      pack([[this.assetId, configs.id]]),
      codec.PackPrefix(this.input),
    ]);
  }
}
