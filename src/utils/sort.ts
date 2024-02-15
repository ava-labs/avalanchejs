import { getPVMManager } from '../serializable/pvm/codec';
import type { TransferableOutput } from '../serializable/avax';
import { getAVMManager } from '../serializable/avm/codec';
import type { Output } from '../serializable/evm';
import { Id } from '../serializable/fxs/common';
import { bytesCompare } from './bytesCompare';
import { isStakeableLockOut } from './typeGuards';

export const compareTransferableOutputs = (
  output1: TransferableOutput,
  output2: TransferableOutput,
): number => {
  const assetIdRes = Id.compare(output1.assetId, output2.assetId);
  if (assetIdRes !== 0) {
    return assetIdRes;
  }

  const pvmOutputTypes = [isStakeableLockOut];
  const avmCodec = getAVMManager().getDefaultCodec();
  const pvmCodec = getPVMManager().getDefaultCodec();

  const codec1 = pvmOutputTypes.some((checker) => checker(output1.output))
    ? pvmCodec
    : avmCodec;
  const codec2 = pvmOutputTypes.some((checker) => checker(output2.output))
    ? pvmCodec
    : avmCodec;

  return bytesCompare(output1.toBytes(codec1), output2.toBytes(codec2));
};

export const compareEVMOutputs = (a: Output, b: Output) => {
  if (a.address.value() === b.address.value()) {
    return bytesCompare(a.assetId.toBytes(), b.assetId.toBytes());
  }
  return a.address.value().localeCompare(b.address.value());
};
