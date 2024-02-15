import { serializable } from '../../common/types';
import { OutputOwners } from './outputOwners';
import { TypeSymbols } from '../../constants';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/mint_output.go
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-mint-output
 */
@serializable()
export class MintOutput {
  _type = TypeSymbols.SecpMintOutput;

  constructor(private readonly outputOwners: OutputOwners) {}

  static fromBytes(bytes: Uint8Array, codec): [MintOutput, Uint8Array] {
    let owners: OutputOwners;
    [owners, bytes] = OutputOwners.fromBytes(bytes, codec);

    return [new MintOutput(owners), bytes];
  }

  toBytes(codec) {
    return this.outputOwners.toBytes(codec);
  }
}
