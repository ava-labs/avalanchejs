import { serializable } from '../../common/types';
import { packSimple, unpack } from '../../utils/struct';
import { Input } from '../secp256k1';
import { TransferOutput } from './transferOutput';

/**
 * https://docs.avax.network/specs/avm-transaction-serialization#nft-transfer-op
 *
 */
@serializable()
export class TransferOperation {
  id = 'nftfx.TransferOperation';

  constructor(private input: Input, private output: TransferOutput) {}

  static fromBytes(bytes: Uint8Array): [TransferOperation, Uint8Array] {
    const [input, output, remaining] = unpack(bytes, [Input, TransferOutput]);

    return [new TransferOperation(input, output), remaining];
  }

  toBytes(): Uint8Array {
    return packSimple(this.input, this.output);
  }
}
