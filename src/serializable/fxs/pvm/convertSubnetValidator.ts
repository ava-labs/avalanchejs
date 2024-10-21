import { pack, unpack } from '../../../utils/struct';
import { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import { BigIntPr } from '../../primitives';
import { TypeSymbols } from '../../constants';
import { emptyNodeId } from '../../../constants/zeroValue';
import { NodeId } from '../common';
import { concatBytes } from '@noble/hashes/utils';
import type { SignerEmpty } from '../../pvm';
import type { Signer } from '../../pvm';
import { PChainOwner } from './pChainOwner';

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
    public readonly signer: Signer | SignerEmpty,
    public readonly remainingBalanceOwner: PChainOwner,
    public readonly deactivationOwner: PChainOwner,
  ) {}

  getBalance() {
    return this.balance.value();
  }

  getRemainingBalanceOwner() {
    return this.remainingBalanceOwner;
  }

  getDeactivationOwner() {
    return this.deactivationOwner;
  }

  static fromNative(
    nodeId: string,
    weight: bigint,
    balance: bigint,
    signer: Signer | SignerEmpty,
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
      [NodeId, BigIntPr, BigIntPr, Codec, PChainOwner, PChainOwner],
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
    return concatBytes(
      pack([this.nodeId, this.weight, this.balance], codec),
      codec.PackPrefix(this.signer),
      pack([this.remainingBalanceOwner, this.deactivationOwner], codec),
    );
  }

  verify(): boolean {
    if (this.weight === new BigIntPr(0n)) {
      throw new Error('Weight must be greater than 0');
    }

    if (this.nodeId === emptyNodeId) {
      throw new Error('Node ID must be non-empty');
    }
    return true;
  }
}
