import { concatBytes } from '../../utils/buffer';
import { toListStruct } from '../../utils/serializeList';
import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { TypeSymbols } from '../constants';
import { Address } from '../fxs/common';
import { Id } from '../fxs/common';
import { ConvertSubnetValidator } from '../fxs/pvm/convertSubnetValidator';
import { AbstractSubnetTx } from './abstractSubnetTx';

@serializable()
export class ConvertSubnetTx extends AbstractSubnetTx {
  _type = TypeSymbols.ConvertSubnetTx;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly subnetID: Id,
    public readonly chainID: Id,
    public readonly address: Address,
    public readonly validators: ConvertSubnetValidator[],
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
  ): [ConvertSubnetTx, Uint8Array] {
    const [baseTx, subnetID, chainID, address, validators, subnetAuth, rest] =
      unpack(
        bytes,
        [BaseTx, Id, Id, Address, toListStruct(ConvertSubnetValidator), Codec],
        codec,
      );
    return [
      new ConvertSubnetTx(
        baseTx,
        subnetID,
        chainID,
        address,
        validators,
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
          this.chainID,
          this.address,
          this.validators,
        ],
        codec,
      ),
      codec.PackPrefix(this.subnetAuth),
    );
  }
}
