import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import type { OutputOwners } from '../fxs/secp256k1';
import { PVMTx } from './abstractTx';
import { TypeSymbols } from '../constants';

/**
 * The docs for this do not match the actual code, there is no rewards owners just Owners
 * @see https://docs.avax.network/specs/platform-transaction-serialization#unsigned-create-subnet-tx
 * @see https://github.com/ava-labs/avalanchego/blob/535456298046b5c2fbcb95ce36702422b6980c66/vms/platformvm/txs/create_subnet_tx.go
 */
@serializable()
export class CreateSubnetTx extends PVMTx {
  _type = TypeSymbols.CreateSubnetTx;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly subnetOwners: Serializable,
  ) {
    super();
  }

  getSubnetOwners() {
    return this.subnetOwners as OutputOwners;
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [CreateSubnetTx, Uint8Array] {
    const [baseTx, subnetOwners, rest] = unpack(bytes, [BaseTx, Codec], codec);
    return [new CreateSubnetTx(baseTx, subnetOwners), rest];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.baseTx], codec),
      codec.PackPrefix(this.subnetOwners),
    );
  }
}
