import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import type { Codec } from '../codec/codec';
import type { Amounter } from '../common/types';
import { serializable } from '../common/types';
import { Id } from '../fxs/common/id';
import { UTXOID } from './utxoId';

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
    public readonly input: Amounter,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [TransferableInput, Uint8Array] {
    const [utxoID, assetId, remaining] = unpack(bytes, [UTXOID, Id]);
    const [input, rest] = codec.UnpackPrefix<Amounter>(remaining);

    return [new TransferableInput(utxoID, assetId, input), rest];
  }

  amount() {
    return this.input.amount();
  }

  getAssetId() {
    return this.assetId.toString();
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.utxoID, this.assetId], codec),
      codec.PackPrefix(this.input),
    );
  }
}
