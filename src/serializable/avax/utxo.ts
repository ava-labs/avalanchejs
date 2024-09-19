import { concatBytes } from '@noble/hashes/utils';
import { UTXOID } from '.';
import { isRewardsOwner, isStakeableLockOut, isTransferOut } from '../../utils';
import { pack, unpack } from '../../utils/struct';
import { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { Id } from '../fxs/common';
import { TypeSymbols } from '../constants';

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-Exporttx
 */
@serializable()
export class Utxo<Output extends Serializable = Serializable> {
  _type = TypeSymbols.UTXO;

  constructor(
    public readonly utxoId: UTXOID,
    public readonly assetId: Id,
    public readonly output: Output,
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [Utxo, Uint8Array] {
    const [utxoId, assetId, output, remaining] = unpack(
      bytes,
      [UTXOID, Id, Codec],
      codec,
    );
    return [new Utxo(utxoId, assetId, output), remaining];
  }

  getOutputOwners() {
    if (isTransferOut(this.output)) {
      return this.output.outputOwners;
    }
    if (isStakeableLockOut(this.output)) {
      return this.output.getOutputOwners();
    }
    if (isRewardsOwner(this.output)) {
      return this.output;
    }
    throw new Error('unable to get output owner');
  }

  toBytes(codec) {
    return concatBytes(
      pack([this.utxoId, this.assetId], codec),
      codec.PackPrefix(this.output),
    );
  }

  getAssetId() {
    return this.assetId.toString();
  }

  ID() {
    return this.utxoId.ID();
  }
}
