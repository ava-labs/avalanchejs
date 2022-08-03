import { isTransferInput } from '../../utils';
import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import type { Codec } from '../codec/codec';
import type { Amounter } from '../common/types';
import { serializable } from '../common/types';
import { Id } from '../fxs/common/id';
import { Input, TransferInput } from '../fxs/secp256k1';
import { BigIntPr, Int } from '../primitives';
import { UTXOID } from './utxoId';

const transferableInputType = Symbol('avax.TransferableInput');

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/components/avax/transferables.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization#transferable-input
 * @see https://docs.avax.network/specs/avm-transaction-serialization#transferable-input
 * @see https://docs.avax.network/specs/platform-transaction-serialization#transferable-input
 */
@serializable()
export class TransferableInput {
  _type = transferableInputType;

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

  static fromNative(
    utxoId: string,
    outputIdx: number,
    assetId: string,
    amount: bigint,
    sigIndices: number[],
  ) {
    return new TransferableInput(
      UTXOID.fromNative(utxoId, outputIdx),
      Id.fromString(assetId),
      new TransferInput(
        new BigIntPr(amount),
        new Input(sigIndices.map((num) => new Int(num))),
      ),
    );
  }

  sigIndicies() {
    const input = this.input;
    if (!isTransferInput(input)) {
      throw new Error('unknown input');
    }
    return input.sigIndicies();
  }

  static compare(input1: TransferableInput, input2: TransferableInput): number {
    return UTXOID.compare(input1.utxoID, input2.utxoID);
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
