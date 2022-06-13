import { serializable } from '../../common/types';
import { configs, unpack } from '../../utils/struct';
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
    // TODO
    return new Uint8Array();
  }
}
