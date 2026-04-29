import { PVMTx } from './abstractTx';
import { BaseTx } from '../avax/baseTx';
import { TransferableOutput } from '../avax/transferableOutput';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { Codec } from '../codec';
import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import { BigIntPr, Int } from '../primitives';
import { packList, toListStruct } from '../../utils/serializeList';
import { Signer } from './signer';
import type { OutputOwners } from '../fxs/secp256k1';
import { NodeId } from '../fxs/common/nodeId';
import { TypeSymbols } from '../constants';

@serializable()
export class AddAutoRenewedValidatorTx extends PVMTx {
  _type = TypeSymbols.AddAutoRenewedValidatorTx;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly nodeId: NodeId,
    public readonly signer: Signer,
    public readonly stake: readonly TransferableOutput[],
    public readonly validatorRewardsOwner: Serializable,
    public readonly delegatorRewardsOwner: Serializable,
    public readonly owner: Serializable,
    public readonly shares: Int,
    public readonly weight: BigIntPr,
    public readonly autoCompoundRewardShares: Int,
    public readonly period: BigIntPr,
  ) {
    super();
  }

  getValidatorRewardsOwner() {
    return this.validatorRewardsOwner as OutputOwners;
  }

  getDelegatorRewardsOwner() {
    return this.delegatorRewardsOwner as OutputOwners;
  }

  getOwner() {
    return this.owner as OutputOwners;
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [AddAutoRenewedValidatorTx, Uint8Array] {
    const [
      baseTx,
      nodeId,
      signer,
      stakeOuts,
      validatorRewardsOwner,
      delegatorRewardsOwner,
      owner,
      delegationShares,
      weight,
      autoCompoundRewardShares,
      period,
      rest,
    ] = unpack(
      bytes,
      [
        BaseTx,
        NodeId,
        Codec,
        toListStruct(TransferableOutput),
        Codec,
        Codec,
        Codec,
        Int,
        BigIntPr,
        Int,
        BigIntPr,
      ],
      codec,
    );

    if (!(signer instanceof Signer)) {
      throw new Error(
        'AddAutoRenewedValidatorTx requires a non-empty BLS Signer',
      );
    }

    return [
      new AddAutoRenewedValidatorTx(
        baseTx,
        nodeId,
        signer,
        stakeOuts,
        validatorRewardsOwner,
        delegatorRewardsOwner,
        owner,
        delegationShares,
        weight,
        autoCompoundRewardShares,
        period,
      ),
      rest,
    ];
  }

  toBytes(codec: Codec): Uint8Array {
    return concatBytes(
      pack([this.baseTx, this.nodeId], codec),
      codec.PackPrefix(this.signer),
      packList(this.stake, codec),
      codec.PackPrefix(this.validatorRewardsOwner),
      codec.PackPrefix(this.delegatorRewardsOwner),
      codec.PackPrefix(this.owner),
      this.shares.toBytes(),
      this.weight.toBytes(),
      this.autoCompoundRewardShares.toBytes(),
      this.period.toBytes(),
    );
  }
}
