import type { Context } from '../../vms/context/model';
import {
  isAddDelegatorTx,
  isAddPermissionlessDelegatorTx,
  isAddPermissionlessValidatorTx,
  isAddSubnetValidatorTx,
  isAddValidatorTx,
  isCreateChainTx,
  isCreateSubnetTx,
  isPvmBaseTx,
  isExportTx as isPvmExportTx,
  isImportTx as isPvmImportTx,
  isRemoveSubnetValidatorTx,
  isTransferSubnetOwnershipTx,
  isTransformSubnetTx,
} from '../../serializable/pvm';
import type { UnsignedTx } from '../../vms/common';
import {
  isAvmBaseTx,
  isExportTx as isAvmExportTx,
  isImportTx as isAvmImportTx,
} from '../../serializable/avm';
import { PrimaryNetworkID } from '../../constants/networkIDs';

/**
 * Validate static burned amount for avalanche x/p transactions
 *
 * @param unsignedTx: unsigned transaction
 * @param context
 * @param burnedAmount: burned amount in nAVAX
 * @return {boolean} isValid: : true if the burned amount is valid, false otherwise.
 * @return {bigint} txFee: burned amount in nAVAX
 */
export const validateStaticBurnedAmount = ({
  unsignedTx,
  context,
  burnedAmount,
}: {
  unsignedTx: UnsignedTx;
  context: Context;
  burnedAmount: bigint;
}): { isValid: boolean; txFee: bigint } => {
  const tx = unsignedTx.getTx();

  if (isAddValidatorTx(tx)) {
    return validate(burnedAmount, context.addPrimaryNetworkValidatorFee);
  }

  if (isAddDelegatorTx(tx)) {
    return validate(burnedAmount, context.addPrimaryNetworkDelegatorFee);
  }

  if (isCreateSubnetTx(tx)) {
    return validate(burnedAmount, context.createSubnetTxFee);
  }

  if (isCreateChainTx(tx)) {
    return validate(burnedAmount, context.createBlockchainTxFee);
  }

  if (isAddSubnetValidatorTx(tx)) {
    return validate(burnedAmount, context.addSubnetValidatorFee);
  }

  if (isTransformSubnetTx(tx)) {
    return validate(burnedAmount, context.transformSubnetTxFee);
  }

  if (isAddPermissionlessValidatorTx(tx)) {
    const isPrimarySubnet =
      tx.subnetValidator.subnetId.toString() === PrimaryNetworkID.toString();

    return validate(
      burnedAmount,
      isPrimarySubnet
        ? context.addPrimaryNetworkValidatorFee
        : context.addSubnetValidatorFee,
    );
  }

  if (isAddPermissionlessDelegatorTx(tx)) {
    const isPrimarySubnet =
      tx.subnetValidator.subnetId.toString() === PrimaryNetworkID.toString();
    return validate(
      burnedAmount,
      isPrimarySubnet
        ? context.addPrimaryNetworkDelegatorFee
        : context.addSubnetDelegatorFee,
    );
  }

  if (
    isAvmBaseTx(tx) ||
    isPvmBaseTx(tx) ||
    isAvmExportTx(tx) ||
    isAvmImportTx(tx) ||
    isPvmExportTx(tx) ||
    isPvmImportTx(tx) ||
    isRemoveSubnetValidatorTx(tx) ||
    isTransferSubnetOwnershipTx(tx)
  ) {
    return validate(burnedAmount, context.baseTxFee);
  }

  throw new Error(`tx type is not supported`);
};

const validate = (burnedAmount: bigint, expectedAmount: bigint) => ({
  isValid: burnedAmount === expectedAmount,
  txFee: expectedAmount,
});
