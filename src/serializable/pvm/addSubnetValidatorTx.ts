import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { AbstractSubnetTx } from './abstractSubnetTx';
import { SubnetValidator } from './subnetValidator';
import { TypeSymbols } from '../constants';

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#unsigned-add-subnet-validator-tx
 */
@serializable()
export class AddSubnetValidatorTx extends AbstractSubnetTx {
  _type = TypeSymbols.AddSubnetValidatorTx;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly subnetValidator: SubnetValidator,
    public readonly subnetAuth: Serializable,
  ) {
    super();
  }

  getSubnetID() {
    return this.subnetValidator.subnetId;
  }

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
