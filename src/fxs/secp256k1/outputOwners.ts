import { serializable } from '../../common/types';
import { BigIntPr } from '../../primatives/bigintpr';
import { Int } from '../../primatives/int';
import { packSimple, unpack } from '../../utils/struct';
import { Addresses } from '../common/addresses';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/output_owners.go
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-output-owners-output
 */
@serializable()
export class OutputOwners {
  id = 'secp256k1fx.OutputOwners';

  constructor(
    private locktime: BigIntPr,
    private threshold: Int,
    private addrs: Addresses,
  ) {}

  static fromBytes(bytes: Uint8Array): [OutputOwners, Uint8Array] {
    const [locktime, threshold, addresses, remaining] = unpack(bytes, [
      BigIntPr,
      Int,
      Addresses,
    ]);

    return [new OutputOwners(locktime, threshold, addresses), remaining];
  }

  toBytes(): Uint8Array {
    return packSimple(this.locktime, this.threshold, this.addrs);
  }
}
