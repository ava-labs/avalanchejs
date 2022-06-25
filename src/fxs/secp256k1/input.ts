import { serializable } from '../../common/types';
import { Ints } from '../../primitives';
import { packSimple, unpack } from '../../utils/struct';

const _symbol = Symbol('secp256k1fx.Input');

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/input.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization/#secp256k1-transfer-input
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-transfer-input
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-transfer-input
 */
@serializable()
export class Input {
  _type = _symbol;

  constructor(private sigIndices: Ints) {}

  static fromBytes(bytes: Uint8Array): [Input, Uint8Array] {
    const [sigIndices, remaining] = unpack(bytes, [Ints] as const);
    return [new Input(sigIndices), remaining];
  }

  toBytes() {
    return packSimple(this.sigIndices);
  }
}
