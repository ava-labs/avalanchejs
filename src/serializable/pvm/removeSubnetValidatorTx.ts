import { BaseTx } from '../avax/baseTx';
import { Codec } from '../codec/codec';
import { concatBytes } from '../../utils/buffer';
import { Id } from '../fxs/common';
import { NodeId } from '../fxs/common/nodeId';
import { pack, unpack } from '../../utils/struct';
import { serializable } from '../common/types';
import type { Serializable } from '../common/types';
import { TypeSymbols } from '../constants';
import { AbstractSubnetTx } from './abstractSubnetTx';

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#unsigned-remove-subnet-validator-tx
 */
@serializable()
export class RemoveSubnetValidatorTx extends AbstractSubnetTx {
  _type = TypeSymbols.RemoveSubnetValidatorTx;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly nodeId: NodeId,
    public readonly subnetId: Id,
    public readonly subnetAuth: Serializable,
  ) {
    super();
  }

  getSubnetID() {
    return this.subnetId;
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [RemoveSubnetValidatorTx, Uint8Array] {
    const [baseTx, nodeId, subnetId, subnetAuth, rest] = unpack(
      bytes,
      [BaseTx, NodeId, Id, Codec],
      codec,
    );
    return [
      new RemoveSubnetValidatorTx(baseTx, nodeId, subnetId, subnetAuth),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.baseTx, this.nodeId, this.subnetId], codec),
      codec.PackPrefix(this.subnetAuth),
    );
  }
}
