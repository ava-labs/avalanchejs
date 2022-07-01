import type { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import { TransferableInput } from '../../components/avax';
import { BigIntPr } from '../../primitives';
import { packSwitched, unpack } from '../../utils/struct';

const _symbol = Symbol('pvm.StakableLockIn');

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#stakeablelockin
 */
@serializable()
export class StakableLockIn {
  _type = _symbol;

  constructor(
    public readonly lockTime: BigIntPr,
    public readonly transferableInput: TransferableInput,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [StakableLockIn, Uint8Array] {
    const [lockTime, transferableInput, rest] = unpack(
      bytes,
      [BigIntPr, TransferableInput],
      codec,
    );
    return [new StakableLockIn(lockTime, transferableInput), rest];
  }

  toBytes(codec: Codec) {
    return packSwitched(codec, this.lockTime, this.transferableInput);
  }
}
