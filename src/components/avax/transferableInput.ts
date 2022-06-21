import { UTXOID } from '.';
import type { Codec } from '../../codec/codec';
import type { Serializable } from '../../common/types';
import { serializable } from '../../common/types';
import { Id } from '../../fxs/common/id';
import { concatBytes } from '../../utils/buffer';
import { packSimple, unpack } from '../../utils/struct';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/components/avax/transferables.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization#transferable-input
 * @see https://docs.avax.network/specs/avm-transaction-serialization#transferable-input
 * @see https://docs.avax.network/specs/platform-transaction-serialization#transferable-input
 */
@serializable()
export class TransferableInput {
  id = 'avax.TransferableInput';

  constructor(
    private utxoID: UTXOID,
    private assetId: Id,
    private input: Serializable,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [TransferableInput, Uint8Array] {
    const [utxoID, assetId, remaining] = unpack(bytes, [UTXOID, Id]);

    let input: Serializable;
    [input, bytes] = codec.UnpackPrefix(remaining);

    return [new TransferableInput(utxoID, assetId, input), bytes];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      packSimple(this.utxoID, this.assetId),
      codec.PackPrefix(this.input),
    );
  }
}
