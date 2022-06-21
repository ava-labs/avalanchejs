import type { Codec } from '../../codec/codec';
import type { Serializable } from '../../common/types';
import { serializable } from '../../common/types';
import { Id } from '../../fxs/common/id';
import { concatBytes } from '../../utils/buffer';
import { packSimple, unpack } from '../../utils/struct';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/components/avax/transferables.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization#transferable-output
 * @see https://docs.avax.network/specs/avm-transaction-serialization#transferable-output
 * @see https://docs.avax.network/specs/platform-transaction-serialization#transferable-output
 */
@serializable()
export class TransferableOutput {
  id = 'avax.TransferableOutput';

  constructor(private assetId: Id, private output: Serializable) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [TransferableOutput, Uint8Array] {
    const [assetId, remaining] = unpack(bytes, [Id]);
    const [output, rest] = codec.UnpackPrefix(remaining);
    return [new TransferableOutput(assetId, output), rest];
  }

  toBytes(codec: Codec) {
    return concatBytes(packSimple(this.assetId), codec.PackPrefix(this.output));
  }
}
