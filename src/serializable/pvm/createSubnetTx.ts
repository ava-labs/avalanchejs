import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { OutputOwners } from '../fxs/secp256k1';
import { PVMTx } from './abstractTx';

export const createSubnetTx_symbol = Symbol('pvm.CreateSubnetTx');

/**
 * @see
 */
@serializable()
export class CreateSubnetTx extends PVMTx {
  _type = createSubnetTx_symbol;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly rewardsOwner: OutputOwners,
  ) {
    super();
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [CreateSubnetTx, Uint8Array] {
    const [baseTx, rewardsOwner, rest] = unpack(
      bytes,
      [BaseTx, OutputOwners],
      codec,
    );
    return [new CreateSubnetTx(baseTx, rewardsOwner), rest];
  }

  toBytes(codec: Codec) {
    return pack([this.baseTx, this.rewardsOwner], codec);
  }
}
