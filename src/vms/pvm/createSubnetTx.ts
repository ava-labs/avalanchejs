import type { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import { BaseTx } from '../../components/avax';
import { OutputOwners } from '../../fxs/secp256k1';
import { pack, unpack } from '../../utils/struct';

const _symbol = Symbol('pvm.CreateSubnetTx');

/**
 * @see
 */
@serializable()
export class CreateSubnetTx {
  _type = _symbol;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly rewardsOwner: OutputOwners,
  ) {}

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
