import { concatBytes } from '@noble/hashes/utils';
import { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { BigIntPr } from '../primitives';
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
    public readonly transferableInput: Serializable,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [StakableLockIn, Uint8Array] {
    const [lockTime, transferableInput, rest] = unpack(
      bytes,
      [BigIntPr, Codec],
      codec,
    );
    return [new StakableLockIn(lockTime, transferableInput), rest];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      packSwitched(codec, this.lockTime),
      codec.PackPrefix(this.transferableInput),
    );
  }
}
