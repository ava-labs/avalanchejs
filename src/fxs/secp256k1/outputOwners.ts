import { configs, pack, unpack } from '../../utils/struct';
import { serializable } from '../../common/types';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/output_owners.go
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-output-owners-output
 */
@serializable()
export class OutputOwners {
  id = 'secp256k1fx.OutputOwners';

  constructor(
    private locktime: bigint,
    private threshold: number,
    private addrs: string[],
  ) {}

  static fromBytes(bytes: Uint8Array): [OutputOwners, Uint8Array] {
    let locktime: bigint;
    let threshold: number;
    let addrs: string[];
    [locktime, threshold, addrs, bytes] = unpack<[bigint, number, string[]]>(
      bytes,
      [configs.bigInt, configs.int, configs.addressList],
    );

    return [new OutputOwners(locktime, threshold, addrs), bytes];
  }

  toBytes(): Uint8Array {
    return pack([
      [this.locktime, configs.bigInt],
      [this.threshold, configs.int],
      [this.addrs, configs.addressList],
    ]);
  }
}
