import { OutputOwners } from '.';
import { serializable } from '../../common/types';
import { BigIntPr } from '../../primitives';
import { packSimple, unpack } from '../../utils/struct';

const _symbol = Symbol('secp256k1fx.TransferOutput');

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/transfer_output.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization/#secp256k1-transfer-output
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-transfer-output
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-transfer-output
 */
@serializable()
export class TransferOutput {
  _type = _symbol;

  constructor(private amt: BigIntPr, private outputOwners: OutputOwners) {}

  static fromBytes(bytes: Uint8Array): [TransferOutput, Uint8Array] {
    const [amt, owners, remaining] = unpack(bytes, [BigIntPr, OutputOwners]);

    return [new TransferOutput(amt, owners), remaining];
  }

  toBytes() {
    return packSimple(this.amt, this.outputOwners);
  }
}
