import { PVMTx } from './abstractTx';
import { BaseTx } from '../avax/baseTx';
import { TransferableOutput } from '../avax/transferableOutput';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { Codec } from '../codec';
import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import { BigIntPr, Bytes, Int } from '../primitives';
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
    public readonly validatorAuthority: Serializable,
    public readonly delegationShares: Int,
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

  getValidatorAuthority() {
    return this.validatorAuthority as OutputOwners;
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [AddAutoRenewedValidatorTx, Uint8Array] {
    const [
      baseTx,
      nodeIdBytes,
      signer,
      stakeOuts,
      validatorRewardsOwner,
      delegatorRewardsOwner,
      validatorAuthority,
      delegationShares,
      autoCompoundRewardShares,
      period,
      rest,
    ] = unpack(
      bytes,
      [
        BaseTx,
        Bytes,
        Codec,
        toListStruct(TransferableOutput),
        Codec,
        Codec,
        Codec,
        Int,
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
        new NodeId(nodeIdBytes.bytes),
        signer,
        stakeOuts,
        validatorRewardsOwner,
        delegatorRewardsOwner,
        validatorAuthority,
        delegationShares,
        autoCompoundRewardShares,
        period,
      ),
      rest,
    ];
  }

  toBytes(codec: Codec): Uint8Array {
    return concatBytes(
      pack([this.baseTx], codec),
      new Bytes(this.nodeId.toBytes()).toBytes(),
      codec.PackPrefix(this.signer),
      packList(this.stake, codec),
      codec.PackPrefix(this.validatorRewardsOwner),
      codec.PackPrefix(this.delegatorRewardsOwner),
      codec.PackPrefix(this.validatorAuthority),
      this.delegationShares.toBytes(),
      this.autoCompoundRewardShares.toBytes(),
      this.period.toBytes(),
    );
  }
}
