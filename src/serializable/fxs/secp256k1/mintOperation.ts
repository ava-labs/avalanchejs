import { Input, MintOutput, TransferOutput } from '.';
import { serializable } from '../../../common/types';
import { concatBytes } from '../../../utils/buffer';
import { unpack } from '../../../utils/struct';

const _symbol = Symbol('secp256k1fx.MintOperation');

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/mint_operation.go
 * @see https://docs.avax.network/specs/avm-transaction-serialization#secp256k1-mint-operation
 */
@serializable()
export class MintOperation {
  _type = _symbol;

  constructor(
    private readonly input: Input,
    private readonly mintOutput: MintOutput,
    private readonly transferOutput: TransferOutput,
  ) {}

  static fromBytes(bytes: Uint8Array): [MintOperation, Uint8Array] {
    const [input, mintOutput, transferOutput, remaining] = unpack(bytes, [
      Input,
      MintOutput,
      TransferOutput,
    ] as const);

    return [new MintOperation(input, mintOutput, transferOutput), remaining];
  }

  toBytes(codec) {
    return concatBytes(
      this.input.toBytes(codec),
      this.mintOutput.toBytes(codec),
      this.transferOutput.toBytes(codec),
    );
  }
}
