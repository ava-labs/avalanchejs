import { concatBytes } from '@noble/hashes/utils';
import { packList, toListStruct } from '../../../utils/serializeList';
import { pack, unpack } from '../../../utils/struct';
import { serializable } from '../../common/types';
import { Int } from '../../primitives';
import { Address } from '../common/address';
import { TypeSymbols } from '../../constants';
import type { Codec } from '../../codec';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/platformvm/warp/message/register_subnet_validator.go
 */
@serializable()
export class PChainOwner {
  _type = TypeSymbols.PChainOwner;

  constructor(
    public readonly threshold: Int,
    public readonly addresses: Address[],
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [PChainOwner, Uint8Array] {
    const [threshold, addresses, remaining] = unpack(
      bytes,
      [Int, toListStruct(Address)],
      codec,
    );
    return [new PChainOwner(threshold, addresses), remaining];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.threshold, this.addresses], codec),
      // packList(this.addresses, codec),
    );
  }
}
