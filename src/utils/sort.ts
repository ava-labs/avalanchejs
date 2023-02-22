import type { TransferableOutput } from '../serializable/avax';
import { getAVMManager } from '../serializable/avm/codec';
import type { Output } from '../serializable/evm';
import { Id } from '../serializable/fxs/common';
import { bytesCompare } from './bytesCompare';

export const compareTransferableOutputs = (
  output1: TransferableOutput,
  output2: TransferableOutput,
): number => {
  const assetIdRes = Id.compare(output1.assetId, output2.assetId);
  if (assetIdRes !== 0) {
    return assetIdRes;
  }
  const codec = getAVMManager().getDefaultCodec();
  return bytesCompare(output1.toBytes(codec), output2.toBytes(codec));
};

export const compareEVMOutputs = (a: Output, b: Output) => {
  if (a.address.value() === b.address.value()) {
    return bytesCompare(a.assetId.toBytes(), b.assetId.toBytes());
  }
  return a.address.value().localeCompare(b.address.value());
};
