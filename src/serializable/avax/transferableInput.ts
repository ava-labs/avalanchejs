import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import {
  isStakeableLockIn,
  isTransferInput,
  isTransferOut,
} from '../../utils/typeGuards';
import type { Codec } from '../codec/codec';
import type { Amounter } from '../common/types';
import { serializable } from '../common/types';
import { Id } from '../fxs/common/id';
import { Input, TransferInput } from '../fxs/secp256k1';
import { BigIntPr, Int } from '../primitives';
import type { Utxo } from './utxo';
import { UTXOID } from './utxoId';
import { TypeSymbols } from '../constants';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/components/avax/transferables.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization#transferable-input
 * @see https://docs.avax.network/specs/avm-transaction-serialization#transferable-input
 * @see https://docs.avax.network/specs/platform-transaction-serialization#transferable-input
 */
@serializable()
export class TransferableInput {
  _type = TypeSymbols.TransferableInput;

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

  static fromUtxoAndSigindicies(utxo: Utxo, sigIndicies: number[]) {
    const out = utxo.output;
    if (!isTransferOut(out)) {
      throw new Error('utxo.output must be Transferout');
    }

    return new TransferableInput(
      utxo.utxoId,
      utxo.assetId,
      TransferInput.fromNative(out.amount(), sigIndicies),
    );
  }

  sigIndicies() {
    const input = this.input;

    if (isTransferInput(input)) {
      return input.sigIndicies();
    }
    if (isStakeableLockIn(input)) {
      const lockedInput = input.transferableInput;

      if (isTransferInput(lockedInput)) {
        return lockedInput.sigIndicies();
      }
    }
    throw new Error('Input must be TransferInput or StakeableLockIn');
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
