import { toListStruct } from '../../utils/serializeList';
import { packSwitched, unpack } from '../../utils/struct';
import { serializable } from '../../vms/common/types';
import { TransferableInput } from '../avax';
import type { Codec } from '../codec';
import { Id } from '../fxs/common';
import { Int } from '../primitives';
import { Output } from './output';

const _symbol = Symbol('evm.ImportTx');

/**
 * @see
 */
@serializable()
export class ImportTx {
  _type = _symbol;

  constructor(
    public readonly networkId: Int,
    public readonly blockchainId: Id,
    public readonly sourceChain: Id,
    public readonly importedInputs: TransferableInput[],
    public readonly Outs: Output[],
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [ImportTx, Uint8Array] {
    const [networkId, blockchainId, sourceChain, importedInputs, Outs, rest] =
      unpack(
        bytes,
        [Int, Id, Id, toListStruct(TransferableInput), toListStruct(Output)],
        codec,
      );
    return [
      new ImportTx(networkId, blockchainId, sourceChain, importedInputs, Outs),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    return packSwitched(
      codec,
      this.networkId,
      this.blockchainId,
      this.sourceChain,
      this.importedInputs,
      this.Outs,
    );
  }
}
