import { concatBytes } from '../../utils/buffer';
import { packList, toListStruct } from '../../utils/serializeList';
import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { TypeSymbols } from '../constants';
import { Id } from '../fxs/common';
import { ConvertSubnetValidator } from '../fxs/pvm/convertSubnetValidator';
import { Bytes } from '../primitives';
import { AbstractSubnetTx } from './abstractSubnetTx';

@serializable()
export class ConvertSubnetTx extends AbstractSubnetTx {
  _type = TypeSymbols.ConvertSubnetTx;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly subnetID: Id,
    public readonly chainID: Id,
    public readonly address: Bytes,
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
        [BaseTx, Id, Id, Bytes, toListStruct(ConvertSubnetValidator), Codec],
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
      pack([this.baseTx, this.subnetID, this.chainID, this.address], codec),
      packList(this.validators, codec),
      codec.PackPrefix(this.subnetAuth),
    );
  }
}
