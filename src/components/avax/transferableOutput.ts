import type { Codec } from '../../codec/codec';
import { Newable, NewableStatic, staticImplements } from '../../common/types';
import { configs, unpack } from '../../utils/struct';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/components/avax/transferables.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization#transferable-output
 * @see https://docs.avax.network/specs/avm-transaction-serialization#transferable-output
 * @see https://docs.avax.network/specs/platform-transaction-serialization#transferable-output
 */
@staticImplements<NewableStatic>()
export class TransferableOutput {
  id = 'avax.TransferableOutput';

  constructor(private amt: string, private output: Newable) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [TransferableOutput, Uint8Array] {
    let assetId: string;
    [assetId, bytes] = unpack<[string]>(bytes, [configs.id]);

    let output: Newable;
    [output, bytes] = codec.UnpackPrefix(bytes);

    return [new TransferableOutput(assetId, output), bytes];
  }

  toBytes(): Uint8Array {
    // TODO
    return new Uint8Array();
  }
}
