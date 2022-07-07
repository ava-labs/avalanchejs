import { serializable } from '../../common/types';
import { packSwitched, unpack } from '../../utils/struct';
import type { Codec } from '../codec';
import { Address, Id } from '../fxs/common';
import { BigIntPr } from '../primitives';

const _symbol = Symbol('evm.Input');

/**
 * @see
 */
@serializable()
export class Input {
  _type = _symbol;

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
