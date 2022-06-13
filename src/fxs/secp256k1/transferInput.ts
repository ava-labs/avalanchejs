import { configs, unpack, pack } from '../../utils/struct';
import { merge } from '../../utils/buffer';
import { Input } from '.';
import { serializable } from '../../common/types';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/transfer_input.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization/#secp256k1-transfer-input
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-transfer-input
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-transfer-input
 */
@serializable()
export class TransferInput {
  id = 'secp256k1fx.TransferInput';

  constructor(private amt: bigint, private input: Input) {}

  static fromBytes(bytes: Uint8Array): [TransferInput, Uint8Array] {
    let amt: bigint;
    [amt, bytes] = unpack<[bigint]>(bytes, [configs.bigInt]);

    let input: Input;
    [input, bytes] = Input.fromBytes(bytes);

    return [new TransferInput(amt, input), bytes];
  }

  toBytes(): Uint8Array {
    return merge([pack([[this.amt, configs.bigInt]]), this.input.toBytes()]);
  }
}
