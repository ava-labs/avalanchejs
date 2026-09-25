import { BlsPublicKey, NodeId } from '../../../../fxs/common';
import { unpack, pack } from '../../../../../utils/struct';
import type { Codec } from '../../../../codec';
import { serializable } from '../../../../common/types';
import { TypeSymbols } from '../../../../constants';
import { BigIntPr, Bytes } from '../../../../primitives';

/**
 * The `ValidatorData` is a structure that contains the data for the initial validator set.
 * It is used in the `SubnetToL1ConversionMessage`.
 *
 * Ref: https://github.com/avalanche-foundation/ACPs/blob/58c78c/ACPs/77-reinventing-subnets/README.md#subnettol1conversionmessage
 */
@serializable()
export class ValidatorData {
  _type = TypeSymbols.ValidatorData;

  constructor(
    public readonly nodeId: NodeId,
    public readonly blsPublicKey: BlsPublicKey,
    public readonly weight: BigIntPr,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [ValidatorData, Uint8Array] {
    const [nodeIdBytes, blsPublicKey, weight, rest] = unpack(
      bytes,
      [Bytes, BlsPublicKey, BigIntPr],
      codec,
    );
    const nodeId = new NodeId(nodeIdBytes.bytes);

    return [new ValidatorData(nodeId, blsPublicKey, weight), rest];
  }

  toBytes(codec: Codec) {
    const nodeIdBytes = new Bytes(this.nodeId.toBytes());
    return pack([nodeIdBytes, this.blsPublicKey, this.weight], codec);
  }
}
