import { Input, MintOutput, TransferOutput } from '.';
import { serializable } from '../../common/types';
import { merge } from '../../utils/buffer';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/mint_operation.go
 * @see https://docs.avax.network/specs/avm-transaction-serialization#secp256k1-mint-operation
 */
@serializable()
export class MintOperation {
  id = 'secp256k1fx.MintOperation';

  constructor(
    private input: Input,
    private mintOutput: MintOutput,
    private transferOutput: TransferOutput,
  ) {}

  static fromBytes(bytes: Uint8Array): [MintOperation, Uint8Array] {
    let input: Input;
    [input, bytes] = Input.fromBytes(bytes);

    let mintOutput: MintOutput;
    [mintOutput, bytes] = MintOutput.fromBytes(bytes);

    let transferOutput: TransferOutput;
    [transferOutput, bytes] = TransferOutput.fromBytes(bytes);

    return [new MintOperation(input, mintOutput, transferOutput), bytes];
  }

  toBytes(): Uint8Array {
    return merge([
      this.input.toBytes(),
      this.mintOutput.toBytes(),
      this.transferOutput.toBytes(),
    ]);
  }
}
