import { Codec } from '../../codec/codec';
import type { Serializable } from '../../common/types';
import { serializable } from '../../common/types';
import { BaseTx } from '../../components/avax';
import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import { SubnetValidator } from './subnetValidator';

const _symbol = Symbol('pvm.AddSubnetValidator');

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#unsigned-add-subnet-validator-tx
 */
@serializable()
export class AddSubnetValidatorTx {
  _type = _symbol;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly subnetValidator: SubnetValidator,
    public readonly subnetAuth: Serializable,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [AddSubnetValidatorTx, Uint8Array] {
    const [baseTx, subnetValidator, subnetAuth, rest] = unpack(
      bytes,
      [BaseTx, SubnetValidator, Codec],
      codec,
    );
    return [
      new AddSubnetValidatorTx(baseTx, subnetValidator, subnetAuth),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.baseTx, this.subnetValidator], codec),
      codec.PackPrefix(this.subnetAuth),
    );
  }
}
