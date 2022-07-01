import type { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import { TransferableOutput } from '../../components/avax';
import { BigIntPr } from '../../primitives';
import { packSwitched, unpack } from '../../utils/struct';

const _symbol = Symbol('pvm.StakableLockOut');

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#stakeablelockin
 */
@serializable()
export class StakableLockOut {
  _type = _symbol;

  constructor(
    public readonly lockTime: BigIntPr,
    public readonly transferableOutput: TransferableOutput,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [StakableLockOut, Uint8Array] {
    const [lockTime, transferableInput, rest] = unpack(
      bytes,
      [BigIntPr, TransferableOutput],
      codec,
    );
    return [new StakableLockOut(lockTime, transferableInput), rest];
  }

  toBytes(codec: Codec) {
    return packSwitched(codec, this.lockTime, this.transferableOutput);
  }
}
