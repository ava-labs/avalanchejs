import { concatBytes } from '../../utils/buffer';
import { packList, toListStruct } from '../../utils/serializeList';
import { pack, unpack } from '../../utils/struct';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { Id } from '../fxs/common/id';
import { Bytes, Int } from '../primitives';
import { TransferableInput } from './transferableInput';
import { TransferableOutput } from './transferableOutput';
import { TypeSymbols } from '../constants';

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-basetx
 */
@serializable()
export class BaseTx {
  _type = TypeSymbols.BaseTx;

  constructor(
    public readonly NetworkId: Int,
    public readonly BlockchainId: Id,
    public readonly outputs: readonly TransferableOutput[],
    public readonly inputs: readonly TransferableInput[],
    public readonly memo: Bytes,
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [BaseTx, Uint8Array] {
    const [networkId, blockchainId, outputs, inputs, memo, remaining] = unpack(
      bytes,
      [
        Int,
        Id,
        toListStruct(TransferableOutput),
        toListStruct(TransferableInput),
        Bytes,
      ],
      codec,
    );
    return [
      new BaseTx(networkId, blockchainId, outputs, inputs, memo),
      remaining,
    ];
  }

  static fromNative(
    networkId: number,
    blockchainId: string,
    outputs: readonly TransferableOutput[],
    inputs: readonly TransferableInput[],
    memo: Uint8Array,
  ) {
    return new BaseTx(
      new Int(networkId),
      Id.fromString(blockchainId),
      outputs,
      inputs,
      new Bytes(memo),
    );
  }

  toBytes(codec) {
    return concatBytes(
      pack([this.NetworkId, this.BlockchainId], codec),
      packList(this.outputs, codec),
      packList(this.inputs, codec),
      this.memo.toBytes(),
    );
  }
}
