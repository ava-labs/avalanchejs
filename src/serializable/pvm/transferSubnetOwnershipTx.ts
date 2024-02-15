import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { TypeSymbols } from '../constants';
import { Id } from '../fxs/common';
import { concatBytes } from '../../utils/buffer';
import { AbstractSubnetTx } from './abstractSubnetTx';
import type { OutputOwners } from '../../serializable/fxs/secp256k1';

/**
 * @see https://github.com/avalanche-foundation/ACPs/blob/main/ACPs/31-enable-subnet-ownership-transfer.md
 * TODO: add doc reference after D-upgrade
 */
@serializable()
export class TransferSubnetOwnershipTx extends AbstractSubnetTx {
  _type = TypeSymbols.TransferSubnetOwnershipTx;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly subnetID: Id,
    public readonly subnetAuth: Serializable, // current owner indices
    public readonly subnetOwners: Serializable, // new owners
  ) {
    super();
  }

  getSubnetID() {
    return this.subnetID;
  }

  getSubnetOwners() {
    return this.subnetOwners as OutputOwners;
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [TransferSubnetOwnershipTx, Uint8Array] {
    const [baseTx, subnetID, subnetAuth, subnetOwners, rest] = unpack(
      bytes,
      [BaseTx, Id, Codec, Codec],
      codec,
    );
    return [
      new TransferSubnetOwnershipTx(baseTx, subnetID, subnetAuth, subnetOwners),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.baseTx, this.subnetID], codec),
      codec.PackPrefix(this.subnetAuth),
      codec.PackPrefix(this.subnetOwners),
    );
  }
}
