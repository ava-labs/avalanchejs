import { pack, unpack } from '../../../../../utils/struct';
import type { Codec } from '../../../../codec';
import { serializable } from '../../../../common/types';
import { TypeSymbols } from '../../../../constants';
import { Id } from '../../../../fxs/common';
import { BigIntPr, Int, Short } from '../../../../primitives';

/**
 * The P-Chain can consume an `L1ValidatorWeightMessage` through a `SetL1ValidatorWeightTx`
 * to update the weight of an existing validator. The P-Chain can also produce an
 * `L1ValidatorWeightMessage` for consumers to verify that the validator weight update has
 * been effectuated.
 *
 * The `L1ValidatorWeightMessage` is specified as an `AddressedCall` with the following payload.
 * When sent from the P-Chain, the `sourceChainID` is set to the P-Chain ID, and the `sourceAddress`
 * is set to an empty byte array.
 *
 * Ref: https://github.com/avalanche-foundation/ACPs/blob/58c78c/ACPs/77-reinventing-subnets/README.md#l1validatorweightmessage
 */
@serializable()
export class L1ValidatorWeightMessage {
  _type = TypeSymbols.L1ValidatorWeightMessage;
  public readonly codecId = new Short(0);
  public readonly typeId = new Int(3);

  constructor(
    public readonly validationId: Id,
    public readonly nonce: BigIntPr,
    public readonly weight: BigIntPr,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [L1ValidatorWeightMessage, Uint8Array] {
    const [typeId, remaining] = unpack(bytes, [Int], codec);
    if (typeId.value() !== 3) {
      throw new Error(
        `Invalid type id for L1ValidatorWeightMessage. Required typeId: 3. Got typeId: ${typeId.value()}`,
      );
    }

    const [validationId, nonce, weight, rest] = unpack(
      remaining,
      [Id, BigIntPr, BigIntPr],
      codec,
    );

    return [new L1ValidatorWeightMessage(validationId, nonce, weight), rest];
  }

  toBytes(codec: Codec) {
    return pack(
      [this.typeId, this.validationId, this.nonce, this.weight],
      codec,
    );
  }

  getWeight() {
    return this.weight.value();
  }

  getNonce() {
    return this.nonce.value();
  }

  getValidationId() {
    return this.validationId.value();
  }
}
