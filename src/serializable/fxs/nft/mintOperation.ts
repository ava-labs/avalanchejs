import { serializable } from '../../common/types';
import { Bytes, Int } from '../../primitives';
import { pack, unpack } from '../../../utils/struct';
import { Input, OutputOwnersList } from '../secp256k1';
import { TypeSymbols } from '../../constants';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/nftfx/mint_operation.go
 * @see https://docs.avax.network/specs/avm-transaction-serialization#nft-mint-op
 */
@serializable()
export class MintOperation {
  _type = TypeSymbols.NftFxMintOperation;
  constructor(
    private readonly input: Input,
    private readonly groupId: Int,
    private readonly payload: Bytes,
    private readonly outputOwnerList: OutputOwnersList,
  ) {}

  static fromBytes(bytes: Uint8Array): [MintOperation, Uint8Array] {
    const [input, groupId, payload, outputOwnerList, remaining] = unpack(
      bytes,
      [Input, Int, Bytes, OutputOwnersList] as const,
    );
    return [
      new MintOperation(input, groupId, payload, outputOwnerList),
      remaining,
    ];
  }

  toBytes(codec) {
    return pack(
      [this.input, this.groupId, this.payload, this.outputOwnerList],
      codec,
    );
  }
}
