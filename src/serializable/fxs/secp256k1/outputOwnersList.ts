import { serializable } from '../../common/types';
import { packList, unpackList } from '../../../utils/serializeList';
import { OutputOwners } from './outputOwners';
import { TypeSymbols } from '../../constants';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/output_owners.go
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-output-owners-output
 */
@serializable()
export class OutputOwnersList {
  _type = TypeSymbols.OutputOwnersList;

  constructor(private readonly outputOwners: OutputOwners[]) {}

  static fromBytes(bytes: Uint8Array, codec): [OutputOwnersList, Uint8Array] {
    const [owners, remaining] = unpackList(bytes, OutputOwners, codec);
    return [new OutputOwnersList(owners), remaining];
  }

  toBytes(codec) {
    return packList(this.outputOwners, codec);
  }
}
