import { concatBytes } from '../../utils/buffer';
import { packList, toListStruct } from '../../utils/serializeList';
import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import { TransferableOutput } from '../avax/transferableOutput';
import { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import type { OutputOwners } from '../fxs/secp256k1';
import { Int } from '../primitives';
import { PVMTx } from './abstractTx';
import { Validator } from './validator';
import { TypeSymbols } from '../constants';

/**
 * @deprecated since {@link https://github.com/avalanche-foundation/ACPs/blob/main/ACPs/62-disable-addvalidatortx-and-adddelegatortx.md|Durango-upgrade}
 * @see https://docs.avax.network/specs/platform-transaction-serialization#unsigned-add-validator-tx
 */
@serializable()
export class AddValidatorTx extends PVMTx {
  _type = TypeSymbols.AddValidatorTx;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly validator: Validator,
    public readonly stake: TransferableOutput[],
    public readonly rewardsOwner: Serializable,
    public readonly shares: Int,
  ) {
    super();
  }

  getRewardsOwner() {
    return this.rewardsOwner as OutputOwners;
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [AddValidatorTx, Uint8Array] {
    const [baseTx, validator, stake, rewardsOwner, shares, rest] = unpack(
      bytes,
      [BaseTx, Validator, toListStruct(TransferableOutput), Codec, Int],
      codec,
    );
    return [
      new AddValidatorTx(baseTx, validator, stake, rewardsOwner, shares),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.baseTx, this.validator], codec),
      packList(this.stake, codec),
      codec.PackPrefix(this.rewardsOwner),
      this.shares.toBytes(),
    );
  }
}
