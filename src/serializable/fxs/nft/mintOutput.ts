import { serializable } from '../../common/types';
import { Int } from '../../primitives';
import { pack, unpack } from '../../../utils/struct';
import { OutputOwners } from '../secp256k1';
import { TypeSymbols } from '../../constants';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/nftfx/mint_output.go
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#nft-mint-output
 */
@serializable()
export class MintOutput {
  _type = TypeSymbols.NftFxMintOutput;

  constructor(
    private readonly groupId: Int,
    private readonly outputOwners: OutputOwners,
  ) {}

  static fromBytes(bytes: Uint8Array, codec): [MintOutput, Uint8Array] {
    const [groupId, owners, remaining] = unpack(
      bytes,
      [Int, OutputOwners] as const,
      codec,
    );

    return [new MintOutput(groupId, owners), remaining];
  }

  toBytes(codec) {
    return pack([this.groupId, this.outputOwners], codec);
  }
}
