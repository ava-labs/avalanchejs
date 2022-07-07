import { toListStruct } from '../../utils/serializeList';
import { packSwitched, unpack } from '../../utils/struct';
import { serializable } from '../../vms/common/types';
import { TransferableOutput } from '../avax';
import type { Codec } from '../codec';
import { Id } from '../fxs/common';
import { Int } from '../primitives';
import { Input } from './input';

const _symbol = Symbol('evm.ExportTx');

/**
 * @see
 */
@serializable()
export class ExportTx {
  _type = _symbol;

  constructor(
    public readonly networkId: Int,
    public readonly blockchainId: Id,
    public readonly destinationChain: Id,
    public readonly ins: Input[],
    public readonly exportedOutputs: TransferableOutput[],
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [ExportTx, Uint8Array] {
    const [networkId, blockchainId, sourceChain, ins, exportedOutputs, rest] =
      unpack(
        bytes,
        [Int, Id, Id, toListStruct(Input), toListStruct(TransferableOutput)],
        codec,
      );
    return [
      new ExportTx(networkId, blockchainId, sourceChain, ins, exportedOutputs),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    return packSwitched(
      codec,
      this.networkId,
      this.blockchainId,
      this.destinationChain,
      this.ins,
      this.exportedOutputs,
    );
  }
}
