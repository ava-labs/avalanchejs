import { serializable } from '../../common/types';
import { configs, unpack, pack } from '../../utils/struct';
import { merge } from '../../utils/buffer';
import { OutputOwners } from '../secp256k1';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/nftfx/transfer_output.go
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#nft-transfer-output
 */
@serializable()
export class TransferOutput {
  id = 'nftfx.TransferOutput';

  constructor(
    private groupId: number,
    private payload: Uint8Array,
    private outputOwners: OutputOwners,
  ) {}

  static fromBytes(bytes: Uint8Array): [TransferOutput, Uint8Array] {
    let groupId: number;
    let payload: Uint8Array;
    [groupId, payload, bytes] = unpack<[number, Uint8Array]>(bytes, [
      configs.int,
      configs.byteList,
    ]);

    let owners: OutputOwners;
    [owners, bytes] = OutputOwners.fromBytes(bytes);

    return [new TransferOutput(groupId, payload, owners), bytes];
  }

  toBytes(): Uint8Array {
    return merge([
      pack([
        [this.groupId, configs.int],
        [this.payload, configs.byteList],
      ]),
      this.outputOwners.toBytes(),
    ]);
  }
}
