import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { Int } from '../primitives';
import { Byte } from '../primitives';
import { BigIntPr } from '../primitives';
import { TypeSymbols } from '../constants';
import { Id } from '../fxs/common';
import { AbstractSubnetTx } from './abstractSubnetTx';

/**
 * @see https://docs.avax.network/reference/avalanchego/p-chain/txn-format#unsigned-transform-subnet-tx
 */
@serializable()
export class TransformSubnetTx extends AbstractSubnetTx {
  _type = TypeSymbols.TransformSubnetTx;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly subnetID: Id,
    public readonly assetId: Id,
    public readonly initialSupply: BigIntPr,
    public readonly maximumSupply: BigIntPr,
    public readonly minConsumptionRate: BigIntPr,
    public readonly maxConsumptionRate: BigIntPr,
    public readonly minValidatorStake: BigIntPr,
    public readonly maxValidatorStake: BigIntPr,
    public readonly minStakeDuration: Int,
    public readonly maxStakeDuration: Int,
    public readonly minDelegationFee: Int,
    public readonly minDelegatorStake: BigIntPr,
    public readonly maxValidatorWeightFactor: Byte,
    public readonly uptimeRequirement: Int,
    public readonly subnetAuth: Serializable,
  ) {
    super();
  }

  getSubnetID() {
    return this.subnetID;
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [TransformSubnetTx, Uint8Array] {
    const [
      baseTx,
      subnetID,
      assetId,
      initialSupply,
      maximumSupply,
      minConsumptionRate,
      maxConsumptionRate,
      minValidatorStake,
      maxValidatorStake,
      minStakeDuration,
      maxStakeDuration,
      minDelegationFee,
      minDelegatorStake,
      maxValidatorWeightFactor,
      uptimeRequirement,
      subnetAuth,
      rest,
    ] = unpack(
      bytes,
      [
        BaseTx,
        Id,
        Id,
        BigIntPr,
        BigIntPr,
        BigIntPr,
        BigIntPr,
        BigIntPr,
        BigIntPr,
        Int,
        Int,
        Int,
        BigIntPr,
        Byte,
        Int,
        Codec,
      ],
      codec,
    );
    return [
      new TransformSubnetTx(
        baseTx,
        subnetID,
        assetId,
        initialSupply,
        maximumSupply,
        minConsumptionRate,
        maxConsumptionRate,
        minValidatorStake,
        maxValidatorStake,
        minStakeDuration,
        maxStakeDuration,
        minDelegationFee,
        minDelegatorStake,
        maxValidatorWeightFactor,
        uptimeRequirement,
        subnetAuth,
      ),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack(
        [
          this.baseTx,
          this.subnetID,
          this.assetId,
          this.initialSupply,
          this.maximumSupply,
          this.minConsumptionRate,
          this.maxConsumptionRate,
          this.minValidatorStake,
          this.maxValidatorStake,
          this.minStakeDuration,
          this.maxStakeDuration,
          this.minDelegationFee,
          this.minDelegatorStake,
          this.maxValidatorWeightFactor,
          this.uptimeRequirement,
        ],
        codec,
      ),
      codec.PackPrefix(this.subnetAuth),
    );
  }
}
