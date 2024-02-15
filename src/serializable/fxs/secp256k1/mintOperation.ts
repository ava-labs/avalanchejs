import { concatBytes } from '../../../utils/buffer';
import { unpack } from '../../../utils/struct';
import { serializable } from '../../common/types';
import { Input } from './input';
import { MintOutput } from './mintOutput';
import { TransferOutput } from './transferOutput';
import { TypeSymbols } from '../../constants';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/mint_operation.go
 * @see https://docs.avax.network/specs/avm-transaction-serialization#secp256k1-mint-operation
 */
@serializable()
export class MintOperation {
  _type = TypeSymbols.SecpMintOperation;

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
