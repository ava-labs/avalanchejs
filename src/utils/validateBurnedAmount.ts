import type { Context } from '../vms/context/model';
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
} from '../serializable/pvm';
import type { Transaction, UnsignedTx } from '../vms/common';
import type { EVMTx } from '../serializable/evm';
import { isImportExportTx as isEvmImportExportTx } from '../serializable/evm';
import { costCorethTx } from './costs';
import {
  isAvmBaseTx,
  isExportTx as isAvmExportTx,
  isImportTx as isAvmImportTx,
} from '../serializable/avm';
import { getBurnedAmountByTx } from './getBurnedAmountByTx';
import type { AvaxTx } from '../serializable/avax';
import { PrimaryNetworkID } from '../constants/networkIDs';

const _getBurnedAmount = (tx: Transaction, context: Context) => {
  const burnedAmounts = getBurnedAmountByTx(tx as AvaxTx | EVMTx);
  return burnedAmounts.get(context.avaxAssetID) ?? 0n;
};

export const validateBurnedAmount = ({
  unsignedTx,
  context,
  burnedAmount,
  evmBaseFee,
  evmFeeTolerance,
}: {
  unsignedTx: UnsignedTx;
  context: Context;
  burnedAmount?: bigint;
  evmBaseFee?: bigint; // fetched from the network and converted into nAvax (https://docs.avax.network/quickstart/transaction-fees#c-chain-fees)
  evmFeeTolerance?: number; // tolerance percentage range where the burned amount is considered valid. e.g.: with evmFeeTolerance = 20% -> (evmBaseFee * 0.8 <= burnedAmount <= evmBaseFee * 1.2)
}): { isValid: boolean; txFee: bigint } => {
  const tx = unsignedTx.getTx();
  const burned = burnedAmount ?? _getBurnedAmount(tx, context);

  const validate = (expectedAmount: bigint) => ({
    isValid: burned === expectedAmount,
    txFee: expectedAmount,
  });

  if (isEvmImportExportTx(tx)) {
    if (!evmBaseFee || !evmFeeTolerance) {
      throw new Error('missing evm fee data');
    }

    const feeToleranceInt = Math.floor(evmFeeTolerance);

    if (feeToleranceInt < 1 || feeToleranceInt > 100) {
      throw new Error('evmFeeTolerance must be [1,100]');
    }

    const feeAmount = evmBaseFee * costCorethTx(unsignedTx);
    const min = (feeAmount * (100n - BigInt(feeToleranceInt))) / 100n;
    const max = (feeAmount * (100n + BigInt(feeToleranceInt))) / 100n;

    return {
      isValid: burned >= min && burned <= max,
      txFee: burned,
    };
  }

  if (isAddValidatorTx(tx)) {
    return validate(context.addPrimaryNetworkValidatorFee);
  }

  if (isAddDelegatorTx(tx)) {
    return validate(context.addPrimaryNetworkDelegatorFee);
  }

  if (isCreateSubnetTx(tx)) {
    return validate(context.createSubnetTxFee);
  }

  if (isCreateChainTx(tx)) {
    return validate(context.createBlockchainTxFee);
  }

  if (isAddSubnetValidatorTx(tx)) {
    return validate(context.addSubnetValidatorFee);
  }

  if (isTransformSubnetTx(tx)) {
    return validate(context.transformSubnetTxFee);
  }

  if (isAddPermissionlessValidatorTx(tx)) {
    const isPrimarySubnet =
      tx.subnetValidator.subnetId.toString() === PrimaryNetworkID.toString();

    return validate(
      isPrimarySubnet
        ? context.addPrimaryNetworkValidatorFee
        : context.addSubnetValidatorFee,
    );
  }

  if (isAddPermissionlessDelegatorTx(tx)) {
    const isPrimarySubnet =
      tx.subnetValidator.subnetId.toString() === PrimaryNetworkID.toString();
    return validate(
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
    return validate(context.baseTxFee);
  }

  throw new Error(`tx type is not supported`);
};
