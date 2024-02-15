import { pack, unpack } from '../../../utils/struct';
import type { Amounter } from '../../common/types';
import { serializable } from '../../common/types';
import { BigIntPr } from '../../primitives';
import { OutputOwners } from './outputOwners';
import { TypeSymbols } from '../../constants';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/transfer_output.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization/#secp256k1-transfer-output
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-transfer-output
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-transfer-output
 */
@serializable()
export class TransferOutput implements Amounter {
  readonly _type = TypeSymbols.TransferOutput;

  constructor(
    public readonly amt: BigIntPr,
    public readonly outputOwners: OutputOwners,
  ) {}

  amount() {
    return this.amt.value();
  }

  getLocktime() {
    return this.outputOwners.locktime.value();
  }

  getOwners() {
    return this.outputOwners.addrs.map((addr) => addr.toBytes());
  }

  getThreshold() {
    return this.outputOwners.threshold.value();
  }

  static fromBytes(bytes: Uint8Array): [TransferOutput, Uint8Array] {
    const [amt, owners, remaining] = unpack(bytes, [BigIntPr, OutputOwners]);

    return [new TransferOutput(amt, owners), remaining];
  }

  toBytes(codec) {
    return pack([this.amt, this.outputOwners], codec);
  }
}
