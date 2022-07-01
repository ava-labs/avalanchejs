import type { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import { BaseTx, TransferableOutput } from '../../components/avax';
import { OutputOwners } from '../../fxs/secp256k1';
import { toListStruct } from '../../utils/serializeList';
import { pack, unpack } from '../../utils/struct';
import { Validator } from './validator';

const _symbol = Symbol('pvm.AddDelegatorTx');

/**
 * @see
 */
@serializable()
export class AddDelegatorTx {
  _type = _symbol;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly validator: Validator,
    public readonly stake: TransferableOutput[],
    public readonly rewardsOwner: OutputOwners,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [AddDelegatorTx, Uint8Array] {
    const [baseTx, validator, stake, rewardsOwner, rest] = unpack(
      bytes,
      [BaseTx, Validator, toListStruct(TransferableOutput), OutputOwners],
      codec,
    );
    return [new AddDelegatorTx(baseTx, validator, stake, rewardsOwner), rest];
  }

  toBytes(codec: Codec) {
    return pack(
      [this.baseTx, this.validator, this.stake, this.rewardsOwner],
      codec,
    );
  }
}
