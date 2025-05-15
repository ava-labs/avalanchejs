import { pack, unpack } from '../../../../../utils/struct';
import type { Codec } from '../../../../codec';
import { serializable } from '../../../../common/types';
import { TypeSymbols } from '../../../../constants';
import { Id } from '../../../../fxs/common';
import { Int, Short, Bool } from '../../../../primitives';

/**
 * The P-Chain can produce an `L1ValidatorRegistrationMessage` for consumers to
 * verify that a validation period has either begun or has been invalidated.
 *
 * The `L1ValidatorRegistrationMessage` is specified as an `AddressedCall` with
 * `sourceChainID` set to the P-Chain ID, the `sourceAddress` set to an empty byte array.
 *
 * Ref: https://github.com/avalanche-foundation/ACPs/blob/58c78c/ACPs/77-reinventing-subnets/README.md#l1validatorregistrationmessage
 */
@serializable()
export class L1ValidatorRegistrationMessage {
  _type = TypeSymbols.L1ValidatorRegistrationMessage;
  public readonly codecId = new Short(0);
  public readonly typeId = new Int(2);

  constructor(
    public readonly validationId: Id,
    public readonly registered: Bool,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [L1ValidatorRegistrationMessage, Uint8Array] {
    const [typeId, remaining] = unpack(bytes, [Int], codec);
    if (typeId.value() !== 2) {
      throw new Error(
        `Invalid type id for L1ValidatorRegistrationMessage. Required typeId: 2. Got typeId: ${typeId.value()}`,
      );
    }

    const [validationId, registered, rest] = unpack(
      remaining,
      [Id, Bool],
      codec,
    );

    return [new L1ValidatorRegistrationMessage(validationId, registered), rest];
  }

  toBytes(codec: Codec) {
    return pack([this.typeId, this.validationId, this.registered], codec);
  }

  getValidationId() {
    return this.validationId.value();
  }

  getRegistered() {
    return this.registered.value();
  }
}
