import type { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import { BaseTx } from '../../components/avax';
import { Byte, Stringpr } from '../../primitives';
import { concatBytes } from '../../utils/buffer';
import { packList, toListStruct } from '../../utils/serializeList';
import { pack, unpack } from '../../utils/struct';
import { InitialState } from './initialState';

const _symbol = Symbol('avm.CreateAssetTx');

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-createassettx
 */
@serializable()
export class CreateAssetTx {
  _type = _symbol;

  constructor(
    private readonly baseTx: BaseTx,
    private readonly name: Stringpr,
    private readonly symbol: Stringpr,
    private readonly denomination: Byte,
    private readonly initialStates: InitialState[],
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [CreateAssetTx, Uint8Array] {
    const [baseTx, name, symbol, domination, initialStates, remaining] = unpack(
      bytes,
      [BaseTx, Stringpr, Stringpr, Byte, toListStruct(InitialState)],
      codec,
    );
    return [
      new CreateAssetTx(baseTx, name, symbol, domination, initialStates),
      remaining,
    ];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.baseTx, this.name, this.symbol, this.denomination], codec),
      packList(this.initialStates, codec),
    );
  }
}
