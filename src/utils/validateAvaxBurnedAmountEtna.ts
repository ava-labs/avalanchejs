import type { Context } from '../vms/context/model';
import {
  isAddPermissionlessDelegatorTx,
  isAddPermissionlessValidatorTx,
  isAddSubnetValidatorTx,
  isCreateChainTx,
  isCreateSubnetTx,
  isPvmBaseTx,
  isExportTx as isPvmExportTx,
  isImportTx as isPvmImportTx,
  isRemoveSubnetValidatorTx,
  isTransferSubnetOwnershipTx,
} from '../serializable/pvm';
import type { UnsignedTx } from '../vms/common';
import type { FeeState } from '../vms/pvm';
import { calculateFee } from '../vms/pvm/txs/fee/calculator';

export const validateAvaxBurnedAmountEtna = ({
  unsignedTx,
  context,
  burnedAmount,
  feeState,
}: {
  unsignedTx: UnsignedTx;
  context: Context;
  burnedAmount: bigint;
  feeState: FeeState;
}): { isValid: boolean; txFee: bigint } => {
  const tx = unsignedTx.getTx();

  const expectedFee = calculateFee(
    unsignedTx.getTx(),
    context.platformFeeConfig.weights,
    feeState.price < context.platformFeeConfig.minPrice
      ? context.platformFeeConfig.minPrice
      : feeState.price,
  );

  if (
    isPvmBaseTx(tx) ||
    isPvmExportTx(tx) ||
    isPvmImportTx(tx) ||
    isAddPermissionlessValidatorTx(tx) ||
    isAddPermissionlessDelegatorTx(tx) ||
    isAddSubnetValidatorTx(tx) ||
    isCreateChainTx(tx) ||
    isCreateSubnetTx(tx) ||
    isRemoveSubnetValidatorTx(tx) ||
    isTransferSubnetOwnershipTx(tx)
  ) {
    return {
      isValid: burnedAmount >= expectedFee,
      txFee: burnedAmount,
    };
  }

  throw new Error(`tx type is not supported`);
};
