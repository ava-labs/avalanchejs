import { packSwitched, unpack } from '../../utils/struct';
import { serializable } from '../../vms/common/types';
import type { Codec } from '../codec';
import { Address, Id } from '../fxs/common';
import { BigIntPr } from '../primitives';
import { TypeSymbols } from '../constants';

/**
 * @see
 */
@serializable()
export class Output {
  _type = TypeSymbols.EvmOutput;

  constructor(
    public readonly address: Address,
    public readonly amount: BigIntPr,
    public readonly assetId: Id,
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [Output, Uint8Array] {
    const [address, amount, assetId, rest] = unpack(
      bytes,
      [Address, BigIntPr, Id],
      codec,
    );
    return [new Output(address, amount, assetId), rest];
  }

  toBytes(codec: Codec) {
    return packSwitched(codec, this.address, this.amount, this.assetId);
  }
}
