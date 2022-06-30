import { UTXOID } from '.';
import type { Codec } from '../../codec/codec';
import type { Serializable } from '../../common/types';
import { serializable } from '../../common/types';
import { Id } from '../../fxs/common/id';
import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';

const _symbol = Symbol('avax.TransferableInput');

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/components/avax/transferables.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization#transferable-input
 * @see https://docs.avax.network/specs/avm-transaction-serialization#transferable-input
 * @see https://docs.avax.network/specs/platform-transaction-serialization#transferable-input
 */
@serializable()
export class TransferableInput {
  _type = _symbol;

  constructor(
    public readonly utxoID: UTXOID,
    public readonly assetId: Id,
    public readonly input: Serializable,
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
      pack([this.utxoID, this.assetId], codec),
      codec.PackPrefix(this.input),
    );
  }
}
