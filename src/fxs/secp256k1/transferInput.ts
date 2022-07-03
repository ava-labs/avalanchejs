import { Input } from '.';
import { serializable } from '../../common/types';
import { BigIntPr } from '../../primitives';
import { pack, unpack } from '../../utils/struct';

const _symbol = Symbol('secp256k1fx.TransferInput');

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/transfer_input.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization/#secp256k1-transfer-input
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-transfer-input
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-transfer-input
 */
@serializable()
export class TransferInput {
  _type = _symbol;

  constructor(private readonly amt: BigIntPr, private readonly input: Input) {}

  static fromBytes(bytes: Uint8Array): [TransferInput, Uint8Array] {
    const [amt, input, remaining] = unpack(bytes, [BigIntPr, Input]);
    return [new TransferInput(amt, input), remaining];
  }

  toBytes(codec) {
    return pack([this.amt, this.input], codec);
  }
}
