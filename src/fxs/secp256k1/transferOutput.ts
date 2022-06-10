import { configs, pack, unpack } from '../../utils/struct';
import { OutputOwners } from './outputOwners';
import { NewableStatic, staticImplements } from '../../common/types';
import { merge } from '../../utils/buffer';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/transfer_output.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization/#secp256k1-transfer-output
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-transfer-output
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-transfer-output
 */
@staticImplements<NewableStatic>()
export class TransferOutput {
  id = 'secp256k1fx.TransferOutput';

  constructor(private amt: bigint, private outputOwners: OutputOwners) {}

  static fromBytes(bytes: Uint8Array): [TransferOutput, Uint8Array] {
    let amt: bigint;
    [amt, bytes] = unpack<[bigint]>(bytes, [configs.bigInt]);

    let owners: OutputOwners;
    [owners, bytes] = OutputOwners.fromBytes(bytes);

    return [new TransferOutput(amt, owners), bytes];
  }

  toBytes(): Uint8Array {
    return merge([
      pack([[this.amt, configs.bigInt]]),
      this.outputOwners.toBytes(),
    ]);
  }
}
