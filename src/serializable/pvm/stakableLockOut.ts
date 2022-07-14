import { concatBytes } from '@noble/hashes/utils';
import { packSwitched, unpack } from '../../utils/struct';
import { Codec } from '../codec/codec';
import type { Amounter } from '../common/types';
import { serializable } from '../common/types';
import { BigIntPr } from '../primitives';
import { isTransferOut } from '../../utils/typeGuards';

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

  /**
   * Get the stakeable locktime of this output. After this date this output can be used like a TransferOut.
   */
  getStakeableLocktime() {
    return this.lockTime.value();
  }

  getLocktime() {
    if (isTransferOut(this.transferOut)) {
      return this.transferOut.getLocktime();
    }
    throw new Error('Unable to get locktime.');
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

  getOwners() {
    if (isTransferOut(this.transferOut)) {
      return this.transferOut.getOwners();
    }
    throw new Error('Unable to get locktime.');
  }

  toBytes(codec: Codec) {
    return concatBytes(
      packSwitched(codec, this.lockTime),
      codec.PackPrefix(this.transferOut),
    );
  }
}
