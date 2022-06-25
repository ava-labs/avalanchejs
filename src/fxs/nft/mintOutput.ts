import { serializable } from '../../common/types';
import { Int } from '../../primitives';
import { packSimple, unpack } from '../../utils/struct';
import { OutputOwners } from '../secp256k1';

const _symbol = Symbol('nftfx.MintOutput');

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/nftfx/mint_output.go
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#nft-mint-output
 */
@serializable()
export class MintOutput {
  _type = _symbol;

  constructor(private groupId: Int, private outputOwners: OutputOwners) {}

  static fromBytes(bytes: Uint8Array): [MintOutput, Uint8Array] {
    const [groupId, owners, remaining] = unpack(bytes, [
      Int,
      OutputOwners,
    ] as const);

    return [new MintOutput(groupId, owners), remaining];
  }

  toBytes() {
    return packSimple(this.groupId, this.outputOwners);
  }
}
