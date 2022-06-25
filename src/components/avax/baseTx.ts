import { concatBytes } from '../../utils/buffer';
import type { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import { TransferableInput, TransferableOutput } from '../../components/avax';
import { Id } from '../../fxs/common/id';
import { Bytes, Int } from '../../primatives';
import { convertListStruct, packList } from '../../utils/serializeList';
import { packSimple, unpack } from '../../utils/struct';

const _symbol = Symbol('avax.BaseTx');

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-basetx
 */
@serializable()
export class BaseTx {
  _type = _symbol;

  constructor(
    private NetworkId: Int,
    private BlockchainId: Id,
    private outputs: TransferableOutput[],
    private inputs: TransferableInput[],
    private memo: Bytes,
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [BaseTx, Uint8Array] {
    const [networkId, blockchainId, outputs, inputs, memo, remaining] = unpack(
      bytes,
      [
        Int,
        Id,
        convertListStruct(TransferableOutput),
        convertListStruct(TransferableInput),
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
      packSimple(this.NetworkId, this.BlockchainId),
      packList(this.outputs, codec),
      packList(this.inputs, codec),
      this.memo.toBytes(),
    );
  }
}
