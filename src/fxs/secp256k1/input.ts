import { configs, unpack } from '../../utils/struct';
import { NewableStatic, staticImplements } from '../../common/types';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/input.go
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization/#secp256k1-transfer-input
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-transfer-input
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-transfer-input
 */
@staticImplements<NewableStatic>()
export class Input {
  id = 'secp256k1fx.Input';

  constructor(private sigIndices: number[]) {}

  static fromBytes(bytes: Uint8Array): [Input, Uint8Array] {
    let sigIndices: number[];
    [sigIndices, bytes] = unpack<[number[]]>(bytes, [configs.intList]);

    return [new Input(sigIndices), bytes];
  }

  toBytes(): Uint8Array {
    // TODO
    return new Uint8Array();
  }
}
