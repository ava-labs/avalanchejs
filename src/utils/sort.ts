import type {
  TransferableInput,
  TransferableOutput,
} from '../serializable/avax';
import { DEFAULT_CODEC_VERSION, getManager } from '../serializable/avm/codec';

export const compareTransferableInputs = (
  a: TransferableInput,
  b: TransferableInput,
) => {
  const txSortResult = a.utxoID.txID
    .value()
    .localeCompare(b.utxoID.txID.value());
  if (txSortResult !== 0) {
    return txSortResult;
  }
  return a.utxoID.outputIdx.value() - a.utxoID.outputIdx.value();
};

export const compareTransferableOutputs = (
  a: TransferableOutput,
  b: TransferableOutput,
) => {
  const manager = getManager();
  const aBytes = manager.packCodec(a, DEFAULT_CODEC_VERSION);
  const bBytes = manager.packCodec(b, DEFAULT_CODEC_VERSION);
  return compareBytes(aBytes, bBytes);
};

export const compareBytes = (a: Uint8Array, b: Uint8Array) => {
  let i;
  for (i = 0; i < a.length && i < b.length; i++) {
    const aByte = a[i];
    const bByte = b[i];
    if (aByte !== bByte) {
      return aByte - bByte;
    }
  }
  if (i === a.length && i === b.length) {
    // throw error?
    return 0;
  }
  return i === a.length ? -1 : 1;
};
