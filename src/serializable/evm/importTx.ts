import { toListStruct } from '../../utils/serializeList';
import { packSwitched, unpack } from '../../utils/struct';
import { serializable } from '../../vms/common/types';
import { TransferableInput } from '../avax/transferableInput';
import type { Codec } from '../codec';
import { Id } from '../fxs/common';
import { Int } from '../primitives';
import { EVMTx } from './abstractTx';
import { Output } from './output';
import { TypeSymbols } from '../constants';

/**
 * @see
 */
@serializable()
export class ImportTx extends EVMTx {
  _type = TypeSymbols.EvmImportTx;

  constructor(
    public readonly networkId: Int,
    public readonly blockchainId: Id,
    public readonly sourceChain: Id,
    public readonly importedInputs: TransferableInput[],
    public readonly Outs: Output[],
  ) {
    super();
  }

  getSigIndices() {
    return this.importedInputs.map((inp) => inp.sigIndicies());
  }

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
