import { concatBytes } from '@noble/hashes/utils';
import { serializable } from '../../../common/types';
import { BigIntPr, Int } from '../../primitives';
import { packList, toListStruct } from '../../../utils/serializeList';
import { pack, unpack } from '../../../utils/struct';
import { Address } from '../common';

const _symbol = Symbol('secp256k1fx.OutputOwners');

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/output_owners.go
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-output-owners-output
 */
@serializable()
export class OutputOwners {
  _type = _symbol;

  constructor(
    public readonly locktime: BigIntPr,
    public readonly threshold: Int,
    public readonly addrs: Address[],
  ) {}

  static fromBytes(bytes: Uint8Array, codec): [OutputOwners, Uint8Array] {
    const [locktime, threshold, addresses, remaining] = unpack(
      bytes,
      [BigIntPr, Int, toListStruct(Address)],
      codec,
    );

    return [new OutputOwners(locktime, threshold, addresses), remaining];
  }

  toBytes(codec) {
    return concatBytes(
      pack([this.locktime, this.threshold], codec),
      packList(this.addrs, codec),
    );
  }
}
