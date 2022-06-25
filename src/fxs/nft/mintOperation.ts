import { serializable } from '../../common/types';
import { Bytes } from '../../primatives/bytes';
import { Int } from '../../primatives/int';
import { packSimple, unpack } from '../../utils/struct';
import { Input } from '../secp256k1';
import { OutputOwnersList } from '../secp256k1/outputOwnersList';

const _symbol = Symbol('nftfx.MintOperation');

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/nftfx/mint_operation.go
 * @see https://docs.avax.network/specs/avm-transaction-serialization#nft-mint-op
 */
@serializable()
export class MintOperation {
  _type = _symbol;
  constructor(
    private input: Input,
    private groupId: Int,
    private payload: Bytes,
    private outputOwnerList: OutputOwnersList,
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

  toBytes() {
    return packSimple(
      this.input,
      this.groupId,
      this.payload,
      this.outputOwnerList,
    );
  }
}
