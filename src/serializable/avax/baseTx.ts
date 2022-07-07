import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { TransferableInput, TransferableOutput } from '.';
import { Id } from '../fxs/common/id';
import { Bytes, Int } from '../primitives';
import { concatBytes } from '../../utils/buffer';
import { packList, toListStruct } from '../../utils/serializeList';
import { pack, unpack } from '../../utils/struct';

const _symbol = Symbol('avax.BaseTx');

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-basetx
 */
@serializable()
export class BaseTx {
  _type = _symbol;

  constructor(
    private readonly NetworkId: Int,
    private readonly BlockchainId: Id,
    private readonly outputs: TransferableOutput[],
    private readonly inputs: TransferableInput[],
    private readonly memo: Bytes,
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

  toBytes(codec) {
    return concatBytes(
      pack([this.NetworkId, this.BlockchainId], codec),
      packList(this.outputs, codec),
      packList(this.inputs, codec),
      this.memo.toBytes(),
    );
  }
}
