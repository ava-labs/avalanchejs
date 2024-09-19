import { concatBytes } from '@noble/hashes/utils';
import { packSwitched, unpack } from '../../utils/struct';
import { isTransferOut } from '../../utils/typeGuards';
import { Codec } from '../codec/codec';
import type { Amounter } from '../common/types';
import { serializable } from '../common/types';
import { BigIntPr } from '../primitives';
import { TypeSymbols } from '../constants';

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#stakeablelockin
 */
@serializable()
export class StakeableLockOut<TransferOut extends Amounter = Amounter>
  implements Amounter
{
  _type = TypeSymbols.StakeableLockOut;

  constructor(
    public readonly lockTime: BigIntPr,
    public readonly transferOut: TransferOut,
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
    return this.lockTime.value();
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [StakeableLockOut, Uint8Array] {
    const [lockTime, transferOut, rest] = unpack(
      bytes,
      [BigIntPr, Codec],
      codec,
    );
    return [new StakeableLockOut(lockTime, transferOut as Amounter), rest];
  }

  getOwners() {
    if (isTransferOut(this.transferOut)) {
      return this.transferOut.getOwners();
    }
    throw new Error('Unable to get owners.');
  }

  getOutputOwners() {
    if (isTransferOut(this.transferOut)) {
      return this.transferOut.outputOwners;
    }
    throw new Error('Unable to get output owners.');
  }

  toBytes(codec: Codec) {
    return concatBytes(
      packSwitched(codec, this.lockTime),
      codec.PackPrefix(this.transferOut),
    );
  }
}
