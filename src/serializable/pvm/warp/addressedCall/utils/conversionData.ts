import { Address, Id } from '../../../../fxs/common';
import { unpack, pack } from '../../../../../utils/struct';
import type { Codec } from '../../../../codec';
import { serializable } from '../../../../common/types';
import { TypeSymbols } from '../../../../constants';
import { Bytes } from '../../../../primitives';
import { ValidatorData } from './validatorData';
import { packList, unpackList } from '../../../../../utils/serializeList';

/**
 * The `ConversionData` is a structure that contains the data for a subnet to L1 conversion.
 * It is used in the `SubnetToL1ConversionMessage`.
 *
 * Ref: https://github.com/avalanche-foundation/ACPs/blob/58c78c/ACPs/77-reinventing-subnets/README.md#subnettol1conversionmessage
 */
@serializable()
export class ConversionData {
  _type = TypeSymbols.ConversionData;

  constructor(
    public readonly subnetId: Id,
    public readonly managerChainId: Id,
    public readonly managerAddress: Address,
    public readonly validators: ValidatorData[],
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [ConversionData, Uint8Array] {
    const [
      subnetId,
      managerChainId,
      managerAddressBytes,
      validatorsBytes,
      rest,
    ] = unpack(bytes, [Id, Id, Bytes, Bytes], codec);
    const managerAddress = new Address(managerAddressBytes.bytes);
    const [validators] = unpackList(
      validatorsBytes.bytes,
      ValidatorData,
      codec,
    );

    return [
      new ConversionData(subnetId, managerChainId, managerAddress, validators),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    const managerAddressBytes = new Bytes(this.managerAddress.toBytes());
    const validatorsBytes = new Bytes(packList(this.validators, codec));
    return pack(
      [
        this.subnetId,
        this.managerChainId,
        managerAddressBytes,
        validatorsBytes,
      ],
      codec,
    );
  }
}
