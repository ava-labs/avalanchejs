import { pack, unpack } from '../../../utils/struct';
import type { Amounter } from '../../common/types';
import { serializable } from '../../common/types';
import { BigIntPr } from '../../primitives';
import { Input } from './input';
import { TypeSymbols } from '../../constants';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/transfer_input.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization/#secp256k1-transfer-input
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-transfer-input
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-transfer-input
 */
@serializable()
export class TransferInput implements Amounter {
  _type = TypeSymbols.TransferInput;

  constructor(private readonly amt: BigIntPr, private readonly input: Input) {}

  static fromBytes(bytes: Uint8Array): [TransferInput, Uint8Array] {
    const [amt, input, remaining] = unpack(bytes, [BigIntPr, Input]);
    return [new TransferInput(amt, input), remaining];
  }

  static fromNative(amount: bigint, sigIndicies: number[]) {
    return new TransferInput(
      new BigIntPr(amount),
      Input.fromNative(sigIndicies),
    );
  }

  sigIndicies() {
    return this.input.values();
  }

  amount() {
    return this.amt.value();
  }
  toBytes(codec) {
    return pack([this.amt, this.input], codec);
  }
}
