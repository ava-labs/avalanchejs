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
export class Input {
  _type = TypeSymbols.EvmInput;

  constructor(
    public readonly address: Address,
    public readonly amount: BigIntPr,
    public readonly assetId: Id,
    public readonly nonce: BigIntPr,
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [Input, Uint8Array] {
    const [address, amount, assetId, nonce, rest] = unpack(
      bytes,
      [Address, BigIntPr, Id, BigIntPr],
      codec,
    );
    return [new Input(address, amount, assetId, nonce), rest];
  }

  static compare = (a: Input, b: Input) => {
    if (a.address.value() !== b.address.value()) {
      return a.address.value().localeCompare(b.address.value());
    }
    return a.assetId.value().localeCompare(b.assetId.value());
  };

  toBytes(codec: Codec) {
    return packSwitched(
      codec,
      this.address,
      this.amount,
      this.assetId,
      this.nonce,
    );
  }
}
