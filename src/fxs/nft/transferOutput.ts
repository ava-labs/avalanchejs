import { serializable } from '../../common/types';
import { Bytes } from '../../primatives/bytes';
import { Int } from '../../primatives/int';
import { packSimple, unpack } from '../../utils/struct';
import { OutputOwners } from '../secp256k1';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/nftfx/transfer_output.go
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#nft-transfer-output
 */
@serializable()
export class TransferOutput {
  id = 'nftfx.TransferOutput';

  constructor(
    private groupId: Int,
    private payload: Bytes,
    private outputOwners: OutputOwners,
  ) {}

  static fromBytes(bytes: Uint8Array): [TransferOutput, Uint8Array] {
    const [groupId, payload, outputOwners, remaining] = unpack(bytes, [
      Int,
      Bytes,
      OutputOwners,
    ] as const);

    return [new TransferOutput(groupId, payload, outputOwners), remaining];
  }

  toBytes(): Uint8Array {
    return packSimple(this.groupId, this.payload, this.outputOwners);
  }
}
