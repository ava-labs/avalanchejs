import { pack, unpack } from '../../../utils/struct';
import type { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import { BigIntPr, Bytes } from '../../primitives';
import { TypeSymbols } from '../../constants';
import { ProofOfPossession } from '../../pvm/proofOfPossession';
import { PChainOwner } from './pChainOwner';
import { emptyNodeId } from '../../../constants/zeroValue';
import { NodeId } from '../common';
import { stringToBytes } from '@scure/base';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/platformvm/txs/convert_subnet_tx.go#86
 */
@serializable()
export class ConvertSubnetValidator {
  _type = TypeSymbols.ConvertSubnetValidator;

  constructor(
    public readonly nodeId: NodeId,
    public readonly weight: BigIntPr,
    public readonly balance: BigIntPr,
    public readonly signer: ProofOfPossession,
    public readonly remainingBalanceOwner: PChainOwner,
    public readonly deactivationOwner: PChainOwner,
  ) {}

  static fromNative(
    nodeId: string,
    weight: bigint,
    balance: bigint,
    signer: ProofOfPossession,
    remainingBalanceOwner: PChainOwner,
    deactivationOwner: PChainOwner,
  ) {
    return new ConvertSubnetValidator(
      NodeId.fromString(nodeId),
      new BigIntPr(weight),
      new BigIntPr(balance),
      signer,
      remainingBalanceOwner,
      deactivationOwner,
    );
  }

  static fromBytes(bytes: Uint8Array): [ConvertSubnetValidator, Uint8Array] {
    const [
      nodeId,
      weight,
      balance,
      signer,
      remainingBalanceOwner,
      deactivationOwner,
      rest,
    ] = unpack(bytes, [
      NodeId,
      BigIntPr,
      BigIntPr,
      ProofOfPossession,
      PChainOwner,
      PChainOwner,
    ]);

    return [
      new ConvertSubnetValidator(
        nodeId,
        weight,
        balance,
        signer,
        remainingBalanceOwner,
        deactivationOwner,
      ),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    return pack(
      [
        this.nodeId,
        this.weight,
        this.balance,
        this.signer,
        this.remainingBalanceOwner,
        this.deactivationOwner,
      ],
      codec,
    );
  }

  verify(): boolean {
    if (this.weight === new BigIntPr(0n)) {
      throw new Error('Weight must be greater than 0');
    }

    // const nodeId = new NodeId(this.nodeId.toBytesWithoutLength());

    if (this.nodeId === emptyNodeId) {
      throw new Error('Node ID must be non-empty');
    }
    return true;
  }
}
