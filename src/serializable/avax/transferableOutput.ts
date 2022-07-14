import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import type { Codec } from '../codec/codec';
import type { Amounter } from '../common/types';
import { serializable } from '../common/types';
import { Address } from '../fxs/common';
import { Id } from '../fxs/common/id';
import { OutputOwners, TransferOutput } from '../fxs/secp256k1';
import { BigIntPr, Int } from '../primitives';

const _symbol = Symbol('avax.TransferableOutput');

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/components/avax/transferables.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization#transferable-output
 * @see https://docs.avax.network/specs/avm-transaction-serialization#transferable-output
 * @see https://docs.avax.network/specs/platform-transaction-serialization#transferable-output
 */
@serializable()
export class TransferableOutput {
  _type = _symbol;

  constructor(public readonly assetId: Id, public readonly output: Amounter) {}

  static fromNative(
    assetId: string,
    amt: bigint,
    locktime: bigint,
    threshold: number,
    addresses: string[],
  ) {
    return new TransferableOutput(
      Id.fromString(assetId),
      new TransferOutput(
        new BigIntPr(amt),
        new OutputOwners(
          new BigIntPr(locktime),
          new Int(threshold),
          addresses.map((addr) => Address.fromString(addr)),
        ),
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
