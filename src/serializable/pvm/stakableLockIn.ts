import { concatBytes } from '@noble/hashes/utils';
import { packSwitched, unpack } from '../../utils/struct';
import type { Codec } from '../codec/codec';
import type { Amounter } from '../common/types';
import { serializable } from '../common/types';
import { BigIntPr } from '../primitives';

const _symbol = Symbol('pvm.StakableLockIn');

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#stakeablelockin
 */
@serializable()
export class StakableLockIn {
  _type = _symbol;

  constructor(
    public readonly lockTime: BigIntPr,
    public readonly transferableInput: Amounter,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [StakableLockIn, Uint8Array] {
    const [lockTime, rest] = unpack(bytes, [BigIntPr], codec);

    const [transferableInput, remaining] = codec.UnpackPrefix<Amounter>(rest);

    return [new StakableLockIn(lockTime, transferableInput), remaining];
  }
  amount() {
    return this.transferableInput.amount();
  }

  toBytes(codec: Codec) {
    return concatBytes(
      packSwitched(codec, this.lockTime),
      codec.PackPrefix(this.transferableInput),
    );
  }
}
