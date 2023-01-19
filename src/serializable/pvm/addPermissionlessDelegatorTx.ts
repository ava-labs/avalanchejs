import { PVMTx } from './abstractTx';
import { BaseTx } from '../avax/baseTx';
import { TransferableOutput } from '../avax/transferableOutput';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { SubnetValidator } from './subnetValidator';
import { Codec } from '../codec';
import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import { packList, toListStruct } from '../../utils/serializeList';

export const addPermissionlessDelegatorTx_symbol = Symbol(
  'pvm.AddPermissionlessDelegator',
);

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#unsigned-add-permissionless-delegator-tx
 */
@serializable()
export class AddPermissionlessDelegatorTx extends PVMTx {
  _type = addPermissionlessDelegatorTx_symbol;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly subnetValidator: SubnetValidator,
    public readonly stake: TransferableOutput[],
    public readonly delegatorRewardsOwner: Serializable,
  ) {
    super();
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [AddPermissionlessDelegatorTx, Uint8Array] {
    const [baseTx, subnetValidator, stakeOuts, delegatorRewardsOwner, rest] =
      unpack(
        bytes,
        [BaseTx, SubnetValidator, toListStruct(TransferableOutput), Codec],
        codec,
      );

    return [
      new AddPermissionlessDelegatorTx(
        baseTx,
        subnetValidator,
        stakeOuts,
        delegatorRewardsOwner,
      ),
      rest,
    ];
  }

  toBytes(codec: Codec): Uint8Array {
    return concatBytes(
      pack([this.baseTx, this.subnetValidator], codec),
      packList(this.stake, codec),
      codec.PackPrefix(this.delegatorRewardsOwner),
    );
  }
}
