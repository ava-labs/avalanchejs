import { PVMTx } from './abstractTx';
import { BaseTx } from '../avax/baseTx';
import { TransferableOutput } from '../avax/transferableOutput';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { SubnetValidator } from './subnetValidator';
import { Codec } from '../codec';
import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import { Int } from '../primitives';
import { packList, toListStruct } from '../../utils/serializeList';
import type { Signer, SignerEmpty } from './signer';
import type { OutputOwners } from '../fxs/secp256k1';
import { TypeSymbols } from '../constants';

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#unsigned-add-permissionless-validator-tx
 */
@serializable()
export class AddPermissionlessValidatorTx extends PVMTx {
  _type = TypeSymbols.AddPermissionlessValidatorTx;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly subnetValidator: SubnetValidator,
    public readonly signer: Signer | SignerEmpty,
    public readonly stake: readonly TransferableOutput[],
    public readonly validatorRewardsOwner: Serializable,
    public readonly delegatorRewardsOwner: Serializable,
    public readonly shares: Int,
  ) {
    super();
  }

  getValidatorRewardsOwner() {
    return this.validatorRewardsOwner as OutputOwners;
  }

  getDelegatorRewardsOwner() {
    return this.delegatorRewardsOwner as OutputOwners;
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [AddPermissionlessValidatorTx, Uint8Array] {
    const [
      baseTx,
      subnetValidator,
      signer,
      stakeOuts,
      validatorRewardsOwner,
      delegatorRewardsOwner,
      delegationShares,
      rest,
    ] = unpack(
      bytes,
      [
        BaseTx,
        SubnetValidator,
        Codec,
        toListStruct(TransferableOutput),
        Codec,
        Codec,
        Int,
      ],
      codec,
    );

    return [
      new AddPermissionlessValidatorTx(
        baseTx,
        subnetValidator,
        signer,
        stakeOuts,
        validatorRewardsOwner,
        delegatorRewardsOwner,
        delegationShares,
      ),
      rest,
    ];
  }

  toBytes(codec: Codec): Uint8Array {
    return concatBytes(
      pack([this.baseTx, this.subnetValidator], codec),
      codec.PackPrefix(this.signer),
      packList(this.stake, codec),
      codec.PackPrefix(this.validatorRewardsOwner),
      codec.PackPrefix(this.delegatorRewardsOwner),
      this.shares.toBytes(),
    );
  }
}
