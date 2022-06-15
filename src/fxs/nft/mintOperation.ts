import { serializable } from '../../common/types';
import { Bytes } from '../../primatives/bytes';
import { Int } from '../../primatives/int';
import { packSimple, unpackSimple } from '../../utils/structSimple';
import { Input, OutputOwnersList } from '../secp256k1';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/nftfx/mint_operation.go
 * @see https://docs.avax.network/specs/avm-transaction-serialization#nft-mint-op
 */
@serializable()
export class MintOperation {
  id = 'nftfx.MintOperation';
  constructor(
    private input: Input,
    private groupId: Int,
    private payload: Bytes,
    private outputOwnerList: OutputOwnersList,
  ) {}

  static fromBytes(bytes: Uint8Array): [MintOperation, Uint8Array] {
    const [input, groupId, payload, outputOwnerList, remaining] = unpackSimple(
      bytes,
      [Input, Int, Bytes, OutputOwnersList] as const,
    );
    return [
      new MintOperation(input, groupId, payload, outputOwnerList),
      remaining,
    ];
  }

  toBytes() {
    return packSimple(
      this.input,
      this.groupId,
      this.payload,
      this.outputOwnerList,
    );
  }
}
