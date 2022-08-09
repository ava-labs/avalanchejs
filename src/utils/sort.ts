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
  const manager = getAVMManager();
  return bytesCompare(manager.packCodec(output1), manager.packCodec(output2));
};

export const compareEVMOutputs = (a: Output, b: Output) => {
  if (a.address.value() === b.address.value()) {
    return bytesCompare(a.assetId.toBytes(), b.assetId.toBytes());
  }
  return a.address.value().localeCompare(b.address.value());
};
