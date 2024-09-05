import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import type { Codec } from '../codec/codec';
import type { Amounter } from '../common/types';
import { serializable } from '../common/types';
import { Id } from '../fxs/common/id';
import { OutputOwners, TransferOutput } from '../fxs/secp256k1';
import { BigIntPr } from '../primitives';
import { TypeSymbols } from '../constants';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/components/avax/transferables.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization#transferable-output
 * @see https://docs.avax.network/specs/avm-transaction-serialization#transferable-output
 * @see https://docs.avax.network/specs/platform-transaction-serialization#transferable-output
 */
@serializable()
export class TransferableOutput {
  _type = TypeSymbols.TransferableOutput;

  constructor(public readonly assetId: Id, public readonly output: Amounter) {}

  static fromNative(
    assetId: string,
    amt: bigint,
    addresses: readonly Uint8Array[],
    locktime?: bigint,
    threshold?: number,
  ) {
    return new TransferableOutput(
      Id.fromString(assetId),
      new TransferOutput(
        new BigIntPr(amt),
        OutputOwners.fromNative(addresses, locktime, threshold),
      ),
    );
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [TransferableOutput, Uint8Array] {
    const [assetId, remaining] = unpack(bytes, [Id], codec);
    const [output, rest] = codec.UnpackPrefix<Amounter>(remaining);
    return [new TransferableOutput(assetId, output), rest];
  }

  getAssetId() {
    return this.assetId.toString();
  }

  amount() {
    return this.output.amount();
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.assetId], codec),
      codec.PackPrefix(this.output),
    );
  }
}
