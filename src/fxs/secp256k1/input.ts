import { serializable } from '../../common/types';
import { Ints } from '../../primatives/ints';
import { packSimple, unpack } from '../../utils/struct';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/input.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization/#secp256k1-transfer-input
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-transfer-input
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-transfer-input
 */
@serializable()
export class Input {
  id = 'secp256k1fx.Input';

  constructor(private sigIndices: Ints) {}

  static fromBytes(bytes: Uint8Array): [Input, Uint8Array] {
    const [sigIndices, remaining] = unpack(bytes, [Ints] as const);
    return [new Input(sigIndices), remaining];
  }

  toBytes(): Uint8Array {
    return packSimple(this.sigIndices);
  }
}
