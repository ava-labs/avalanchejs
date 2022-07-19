import { concatBytes } from '../../utils/buffer';
import { packList, toListStruct } from '../../utils/serializeList';
import { pack, unpack } from '../../utils/struct';
import { BaseTx, TransferableOutput } from '../avax';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { OutputOwners } from '../fxs/secp256k1';
import { Int } from '../primitives';
import { PVMTx } from './abstractTx';
import { Validator } from './validator';

export const addValidatorTx_symbol = Symbol('pvm.AddValidatorTx');

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#unsigned-add-validator-tx
 */
@serializable()
export class AddValidatorTx extends PVMTx {
  _type = addValidatorTx_symbol;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly validator: Validator,
    public readonly stake: TransferableOutput[],
    public readonly rewardsOwner: OutputOwners,
    public readonly shares: Int,
  ) {
    super();
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [AddValidatorTx, Uint8Array] {
    const [baseTx, validator, stake, rewardsOwner, shares, rest] = unpack(
      bytes,
      [BaseTx, Validator, toListStruct(TransferableOutput), OutputOwners, Int],
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
      pack([this.rewardsOwner, this.shares], codec),
    );
  }
}
