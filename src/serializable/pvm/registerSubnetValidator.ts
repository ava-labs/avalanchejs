import { serializable } from '../common/types';
import { TypeSymbols } from '../constants';
import { Id } from '../fxs/common';
import { BigIntPr, Bytes } from '../primitives';
import { PChainOwner } from '../fxs/pvm/pChainOwner';
import type { Codec } from '../codec';
import { pack, unpack } from '../../utils/struct';
import { concatBytes } from '@noble/hashes/utils';

@serializable()
export class RegisterSubnetValidator {
  _type = TypeSymbols.RegisterSubnetValidator;

  constructor(
    public readonly subnetId: Id,
    public readonly nodeId: Bytes,
    public readonly blsPublicKey: Bytes,
    public readonly expiry: BigIntPr,
    public readonly remainingBalanceOwner: PChainOwner,
    public readonly disableOwner: PChainOwner,
    public readonly weight: BigIntPr,
  ) {}

  getSubnetID() {
    return this.subnetId;
  }

  static fromNative(
    subnetId: string,
    nodeId: Uint8Array,
    blsPublicKey: Uint8Array,
    expiry: bigint,
    remainingBalanceOwner: PChainOwner,
    disableOwner: PChainOwner,
    weight: bigint,
  ): RegisterSubnetValidator {
    return new RegisterSubnetValidator(
      Id.fromString(subnetId),
      new Bytes(nodeId),
      new Bytes(blsPublicKey),
      new BigIntPr(expiry),
      remainingBalanceOwner,
      disableOwner,
      new BigIntPr(weight),
    );
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [RegisterSubnetValidator, Uint8Array] {
    const [
      subnetId,
      nodeId,
      blsPublicKey,
      expiry,
      remainingBalanceOwner,
      disableOwner,
      weight,
      rest,
    ] = unpack(
      bytes,
      [Id, Bytes, Bytes, BigIntPr, PChainOwner, PChainOwner, BigIntPr],
      codec,
    );
    return [
      new RegisterSubnetValidator(
        subnetId,
        nodeId,
        blsPublicKey,
        expiry,
        remainingBalanceOwner,
        disableOwner,
        weight,
      ),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack(
        [
          this.subnetId,
          this.nodeId,
          this.blsPublicKey,
          this.expiry,
          this.remainingBalanceOwner,
          this.disableOwner,
          this.weight,
        ],
        codec,
      ),
    );
  }
}
