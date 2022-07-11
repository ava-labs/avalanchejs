import { concatBytes } from '@noble/hashes/utils';
import { packSwitched, unpack } from '../../utils/struct';
import { Codec } from '../codec/codec';
import type { Amounter } from '../common/types';
import { serializable } from '../common/types';
import { BigIntPr } from '../primitives';

export const stakeableLockOut_symbol = Symbol('pvm.StakableLockOut');

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#stakeablelockin
 */
@serializable()
export class StakableLockOut implements Amounter {
  _type = stakeableLockOut_symbol;

  constructor(
    public readonly lockTime: BigIntPr,
    public readonly transferOut: Amounter,
  ) {}

  amount() {
    return this.transferOut.amount();
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [StakableLockOut, Uint8Array] {
    const [lockTime, transferOut, rest] = unpack(
      bytes,
      [BigIntPr, Codec],
      codec,
    );
    return [new StakableLockOut(lockTime, transferOut as Amounter), rest];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      packSwitched(codec, this.lockTime),
      codec.PackPrefix(this.transferOut),
    );
  }
}
