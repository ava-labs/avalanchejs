import { concatBytes } from '@noble/hashes/utils';
import { toListStruct } from '../../utils/serializeList';
import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { Id } from '../fxs/common';
import { Bytes, Stringpr } from '../primitives';
import { PVMTx } from './abstractTx';

export const createChainTx_symbol = Symbol('pvm.CreateChainTx');

/**
 * @see
 */
@serializable()
export class CreateChainTx extends PVMTx {
  _type = createChainTx_symbol;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly subnetID: Id,
    public readonly chainName: Stringpr,
    public readonly vmID: Id,
    public readonly fxIds: Id[],
    public readonly genesisData: Bytes,
    public readonly subnetAuth: Serializable,
  ) {
    super();
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [CreateChainTx, Uint8Array] {
    const [
      baseTx,
      subnetID,
      chainName,
      vmID,
      fxIds,
      genesisData,
      subnetAuth,
      rest,
    ] = unpack(
      bytes,
      [BaseTx, Id, Stringpr, Id, toListStruct(Id), Bytes, Codec],
      codec,
    );
    return [
      new CreateChainTx(
        baseTx,
        subnetID,
        chainName,
        vmID,
        fxIds,
        genesisData,
        subnetAuth,
      ),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack(
        [
          this.baseTx,
          this.subnetID,
          this.chainName,
          this.vmID,
          this.fxIds,
          this.genesisData,
        ],
        codec,
      ),
      codec.PackPrefix(this.subnetAuth),
    );
  }
}
