import { concatBytes } from '../../utils';
import { toListStruct } from '../../utils/serializeList';
import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import { TransferableOutput } from '../avax/transferableOutput';
import { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { PVMTx } from './abstractTx';
import { Validator } from './validator';

export const addDelegatorTx_symbol = Symbol('pvm.AddDelegatorTx');

/**
 * @see
 */
@serializable()
export class AddDelegatorTx extends PVMTx {
  _type = addDelegatorTx_symbol;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly validator: Validator,
    public readonly stake: TransferableOutput[],
    public readonly rewardsOwner: Serializable,
  ) {
    super();
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [AddDelegatorTx, Uint8Array] {
    const [baseTx, validator, stake, rewardsOwner, rest] = unpack(
      bytes,
      [BaseTx, Validator, toListStruct(TransferableOutput), Codec],
      codec,
    );

    return [new AddDelegatorTx(baseTx, validator, stake, rewardsOwner), rest];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.baseTx, this.validator, this.stake], codec),
      codec.PackPrefix(this.rewardsOwner),
    );
  }
}
