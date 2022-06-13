import { OutputOwners } from '.';
import { serializable } from '../../common/types';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/mint_output.go
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-mint-output
 */
@serializable()
export class MintOutput {
  id = 'secp256k1fx.MintOutput';

  constructor(private outputOwners: OutputOwners) {}

  static fromBytes(bytes: Uint8Array): [MintOutput, Uint8Array] {
    let owners: OutputOwners;
    [owners, bytes] = OutputOwners.fromBytes(bytes);

    return [new MintOutput(owners), bytes];
  }

  toBytes(): Uint8Array {
    return this.outputOwners.toBytes();
  }
}
