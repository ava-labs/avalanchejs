import { serializable } from '../../common/types';
import { packList, unpackList } from '../../utils/serializeList';
import { OutputOwners } from './outputOwners';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/output_owners.go
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-output-owners-output
 */
@serializable()
export class OutputOwnersList {
  id = 'secp256k1fx.OutputOwnersList';

  constructor(private outputOwners: OutputOwners[]) {}

  static fromBytes(bytes: Uint8Array): [OutputOwnersList, Uint8Array] {
    const [owners, remaining] = unpackList(bytes, OutputOwners);
    return [new OutputOwnersList(owners), remaining];
  }

  toBytes() {
    return packList(this.outputOwners);
  }
}
