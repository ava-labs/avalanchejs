import { merge } from '../../utils/buffer';
import type { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import type { Serializable } from '../../common/types';
import { configs, pack, unpack } from '../../utils/struct';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/components/avax/transferables.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization#transferable-output
 * @see https://docs.avax.network/specs/avm-transaction-serialization#transferable-output
 * @see https://docs.avax.network/specs/platform-transaction-serialization#transferable-output
 */
@serializable()
export class TransferableOutput {
  id = 'avax.TransferableOutput';

  constructor(private assetId: string, private output: Serializable) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [TransferableOutput, Uint8Array] {
    let assetId: string;
    [assetId, bytes] = unpack<[string]>(bytes, [configs.id]);

    let output: Serializable;
    [output, bytes] = codec.UnpackPrefix(bytes);

    return [new TransferableOutput(assetId, output), bytes];
  }

  toBytes(codec: Codec) {
    return merge([
      pack([[this.assetId, configs.id]]),
      codec.PackPrefix(this.output),
    ]);
  }
}
