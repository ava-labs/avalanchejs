import { pack, unpack } from '../../../../utils/struct';
import type { Codec } from '../../../codec';
import { serializable } from '../../../common/types';
import { TypeSymbols } from '../../../constants';
import { BlsPublicKey, NodeId, Id } from '../../../fxs/common';
import { PChainOwner } from '../../../fxs/pvm';
import { BigIntPr, Int, Short, Bytes } from '../../../primitives';

@serializable()
export class RegisterL1ValidatorPayload {
  _type = TypeSymbols.RegisterL1ValidatorPayload;
  public readonly codecId = new Short(0);
  public readonly typeId = new Int(1);

  constructor(
    public readonly subnetId: Id,
    public readonly nodeId: NodeId,
    public readonly blsPublicKey: BlsPublicKey,
    public readonly expiry: BigIntPr,
    public readonly remainingBalanceOwner: PChainOwner,
    public readonly disableOwner: PChainOwner,
    public readonly weight: BigIntPr,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [RegisterL1ValidatorPayload, Uint8Array] {
    const [typeId, remaining] = unpack(bytes, [Int], codec);
    if (typeId.value() !== 1) {
      throw new Error(
        `Invalid type id for RegisterL1ValidatorPayload. Required typeId: 1. Got typeId: ${typeId.value()}`,
      );
    }

    const [
      subnetId,
      nodeIdBytes,
      blsPublicKey,
      expiry,
      remainingBalanceOwner,
      disableOwner,
      weight,
      rest,
    ] = unpack(
      remaining,
      [Id, Bytes, BlsPublicKey, BigIntPr, PChainOwner, PChainOwner, BigIntPr],
      codec,
    );

    const nodeId = new NodeId(nodeIdBytes.bytes);

    return [
      new RegisterL1ValidatorPayload(
        subnetId,
        nodeId,
        blsPublicKey,
        expiry,
        remainingBalanceOwner,
        disableOwner,
        weight,
      ),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    const nodeIdBytes = new Bytes(this.nodeId.toBytes());
    return pack(
      [
        this.codecId,
        this.typeId,
        this.subnetId,
        nodeIdBytes,
        this.blsPublicKey,
        this.expiry,
        this.remainingBalanceOwner,
        this.disableOwner,
        this.weight,
      ],
      codec,
    );
  }
}
