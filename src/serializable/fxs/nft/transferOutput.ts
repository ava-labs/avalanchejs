import { serializable } from '../../common/types';
import { Bytes, Int } from '../../primitives';
import { pack, unpack } from '../../../utils/struct';
import { OutputOwners } from '../secp256k1';
import { TypeSymbols } from '../../constants';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/nftfx/transfer_output.go
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#nft-transfer-output
 */
@serializable()
export class TransferOutput {
  _type = TypeSymbols.NftFxTransferOutput;

  constructor(
    public readonly groupId: Int,
    public readonly payload: Bytes,
    public readonly outputOwners: OutputOwners,
  ) {}

  static fromBytes(bytes: Uint8Array): [TransferOutput, Uint8Array] {
    const [groupId, payload, outputOwners, remaining] = unpack(bytes, [
      Int,
      Bytes,
      OutputOwners,
    ] as const);

    return [new TransferOutput(groupId, payload, outputOwners), remaining];
  }

  toBytes(codec) {
    return pack([this.groupId, this.payload, this.outputOwners], codec);
  }
}
