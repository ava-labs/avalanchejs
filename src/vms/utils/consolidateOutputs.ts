import { isStakeableLockOut, isTransferOut } from '../../utils';
import {
  TransferableOutput,
  TransferOutput,
  BigIntPr,
  pvmSerial,
} from '../../serializable';
import { consolidate } from '../../utils/consolidate';

const canCombine = (a: TransferableOutput, b: TransferableOutput) => {
  return (
    a.getAssetId() === b.getAssetId() &&
    ((isStakeableLockOut(a.output) &&
      isStakeableLockOut(b.output) &&
      a.output.getStakeableLocktime() === b.output.getStakeableLocktime() &&
      a.output.getOutputOwners().equals(b.output.getOutputOwners())) ||
      (isTransferOut(a.output) &&
        isTransferOut(b.output) &&
        a.output.outputOwners.equals(b.output.outputOwners)))
  );
};

const combine = (a: TransferableOutput, b: TransferableOutput) => {
  if (isStakeableLockOut(a.output) && isStakeableLockOut(b.output)) {
    return new TransferableOutput(
      a.assetId,
      new pvmSerial.StakeableLockOut(
        a.output.lockTime,
        new TransferOutput(
          new BigIntPr(a.amount() + b.amount()),
          a.output.getOutputOwners(),
        ),
      ),
    );
  } else if (isTransferOut(a.output) && isTransferOut(b.output)) {
    return new TransferableOutput(
      a.assetId,
      new TransferOutput(
        new BigIntPr(a.amount() + b.amount()),
        a.output.outputOwners,
      ),
    );
  } else {
    throw new Error('Calling combine on incompatible TransferableOutputs');
  }
};

export const consolidateOutputs = (
  outputs: readonly TransferableOutput[],
): TransferableOutput[] => {
  return consolidate(outputs, canCombine, combine);
};
