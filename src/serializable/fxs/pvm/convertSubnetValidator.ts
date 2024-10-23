import { pack, unpack } from '../../../utils/struct';
import type { Codec } from '../../codec';
import type { Serializable } from '../../common/types';
import { serializable } from '../../common/types';
import { BigIntPr, Bytes } from '../../primitives';
import { TypeSymbols } from '../../constants';
import { ProofOfPossession } from '../../pvm';
import { NodeId } from '../common';
import { PChainOwner } from './pChainOwner';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/platformvm/txs/convert_subnet_tx.go#86
 */
@serializable()
export class ConvertSubnetValidator {
  _type = TypeSymbols.ConvertSubnetValidator;

  constructor(
    public readonly nodeId: Bytes,
    public readonly weight: BigIntPr,
    public readonly balance: BigIntPr,
    public readonly signer: ProofOfPossession,
    public readonly remainingBalanceOwner: Serializable,
    public readonly deactivationOwner: Serializable,
  ) {}

  getBalance() {
    return this.balance;
  }

  getRemainingBalanceOwner() {
    return this.remainingBalanceOwner as PChainOwner;
  }

  getDeactivationOwner() {
    return this.deactivationOwner as PChainOwner;
  }

  static fromNative(
    nodeId: string,
    weight: bigint,
    balance: bigint,
    signer: ProofOfPossession,
    remainingBalanceOwner: PChainOwner,
    deactivationOwner: PChainOwner,
  ) {
    return new ConvertSubnetValidator(
      new Bytes(NodeId.fromString(nodeId).toBytes()),
      new BigIntPr(weight),
      new BigIntPr(balance),
      signer,
      remainingBalanceOwner,
      deactivationOwner,
    );
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [ConvertSubnetValidator, Uint8Array] {
    const [
      nodeId,
      weight,
      balance,
      signer,
      remainingBalanceOwner,
      deactivationOwner,
      rest,
    ] = unpack(
      bytes,
      [Bytes, BigIntPr, BigIntPr, ProofOfPossession, PChainOwner, PChainOwner],
      codec,
    );

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

    // TODO: Properly add this logic back with new types.
    // if (this.nodeId === emptyNodeId) {
    //   throw new Error('Node ID must be non-empty');
    // }
    return true;
  }
}