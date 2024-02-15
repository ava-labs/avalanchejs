import { concatBytes } from '@noble/hashes/utils';
import { packSwitched, unpack } from '../../utils/struct';
import type { Codec } from '../codec/codec';
import type { Amounter } from '../common/types';
import { serializable } from '../common/types';
import { BigIntPr } from '../primitives';
import { TypeSymbols } from '../constants';

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#stakeablelockin
 */
@serializable()
export class StakeableLockIn {
  _type = TypeSymbols.StakeableLockIn;

  constructor(
    public readonly lockTime: BigIntPr,
    public readonly transferableInput: Amounter,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [StakeableLockIn, Uint8Array] {
    const [lockTime, rest] = unpack(bytes, [BigIntPr], codec);

    const [transferableInput, remaining] = codec.UnpackPrefix<Amounter>(rest);

    return [new StakeableLockIn(lockTime, transferableInput), remaining];
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
