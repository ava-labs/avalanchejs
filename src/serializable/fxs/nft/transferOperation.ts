import { serializable } from '../../common/types';
import { pack, unpack } from '../../../utils/struct';
import { Input } from '../secp256k1';
import { TransferOutput } from './transferOutput';
import { TypeSymbols } from '../../constants';

/**
 * https://docs.avax.network/specs/avm-transaction-serialization#nft-transfer-op
 *
 */
@serializable()
export class TransferOperation {
  _type = TypeSymbols.NftFxTransferOperation;

  constructor(
    private readonly input: Input,
    private readonly output: TransferOutput,
  ) {}

  static fromBytes(bytes: Uint8Array): [TransferOperation, Uint8Array] {
    const [input, output, remaining] = unpack(bytes, [Input, TransferOutput]);

    return [new TransferOperation(input, output), remaining];
  }

  toBytes(codec) {
    return pack([this.input, this.output], codec);
  }
}
