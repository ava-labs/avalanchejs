import { OutputOwners } from '../secp256k1/outputOwners';
import { NewableStatic, staticImplements } from '../../common/types';
import { unpack, configs } from '../../utils/struct';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/nftfx/mint_output.go
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#nft-mint-output
 */
@staticImplements<NewableStatic>()
export class MintOutput {
  id = 'nftfx.MintOutput';

  constructor(private groupId: number, private outputOwners: OutputOwners) {}

  static fromBytes(bytes: Uint8Array): [MintOutput, Uint8Array] {
    let groupId: number;
    [groupId, bytes] = unpack<[number]>(bytes, [configs.int]);

    let owners: OutputOwners;
    [owners, bytes] = OutputOwners.fromBytes(bytes);

    return [new MintOutput(groupId, owners), bytes];
  }

  toBytes(): Uint8Array {
    // TODO
    return new Uint8Array();
  }
}
