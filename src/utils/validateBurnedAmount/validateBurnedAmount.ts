import type { Context } from '../../vms/context/model';
import type { Transaction, UnsignedTx } from '../../vms/common';
import type { EVMTx } from '../../serializable/evm';
import { isImportExportTx as isEvmImportExportTx } from '../../serializable/evm';
import { getBurnedAmountByTx } from '../getBurnedAmountByTx';
import type { AvaxTx } from '../../serializable/avax';
import { validateDynamicBurnedAmount } from './validateDynamicBurnedAmount';
import type { GetUpgradesInfoResponse } from '../../info/model';
import { isEtnaEnabled } from '../isEtnaEnabled';
import { validateStaticBurnedAmount } from './validateStaticBurnedAmount';
import { costCorethTx } from '../costs';
import { calculateFee } from '../../vms/pvm/txs/fee/calculator';

import {
  isAddPermissionlessDelegatorTx,
  isAddPermissionlessValidatorTx,
  isAddSubnetValidatorTx,
  isConvertSubnetToL1Tx,
  isCreateChainTx,
  isCreateSubnetTx,
  isDisableL1ValidatorTx,
  isIncreaseL1ValidatorBalanceTx,
  isPvmBaseTx,
  isExportTx as isPvmExportTx,
  isImportTx as isPvmImportTx,
  isRegisterL1ValidatorTx,
  isRemoveSubnetValidatorTx,
  isSetL1ValidatorWeightTx,
  isTransferSubnetOwnershipTx,
} from '../../serializable/pvm';

const _getBurnedAmount = (tx: Transaction, context: Context) => {
  const burnedAmounts = getBurnedAmountByTx(tx as AvaxTx | EVMTx, context);
  return burnedAmounts.get(context.avaxAssetID) ?? 0n;
};

// Check supported pvm transactions for Etna
// Todo: add isAvmBaseTx, isAvmExportTx and isAvmImportTx when avm dynamic fee is implemented
const isEtnaSupported = (tx: Transaction) => {
  return (
    // isAvmBaseTx(tx) || // not implemented
    // isAvmExportTx(tx) || // not implemented
    // isAvmImportTx(tx) || // not implemented
    isPvmBaseTx(tx) ||
    isPvmExportTx(tx) ||
    isPvmImportTx(tx) ||
    isAddPermissionlessValidatorTx(tx) ||
    isAddPermissionlessDelegatorTx(tx) ||
    isAddSubnetValidatorTx(tx) ||
    isCreateChainTx(tx) ||
    isCreateSubnetTx(tx) ||
    isRemoveSubnetValidatorTx(tx) ||
    isTransferSubnetOwnershipTx(tx) ||
    isConvertSubnetToL1Tx(tx) ||
    isRegisterL1ValidatorTx(tx) ||
    isSetL1ValidatorWeightTx(tx) ||
    isIncreaseL1ValidatorBalanceTx(tx) ||
    isDisableL1ValidatorTx(tx)
  );
};

/**
 * Validate burned amount for avalanche transactions
 *
 * @param unsignedTx: unsigned transaction
 * @param burnedAmount: burned amount in nAVAX
 * @param baseFee
 ** c-chain: fetched from the network and converted into nAvax (https://docs.avax.network/quickstart/transaction-fees#c-chain-fees)
 ** x/p-chain: pvm dynamic fee calculator, https://github.com/ava-labs/avalanchego/blob/master/vms/platformvm/txs/fee/dynamic_calculator.go
 * @param feeTolerance: tolerance percentage range where the burned amount is considered valid. e.g.: with FeeTolerance = 20% -> (expectedFee <= burnedAmount <= expectedFee * 1.2)
 * @return {boolean} isValid: : true if the burned amount is valid, false otherwise.
 * @return {bigint} txFee: burned amount in nAVAX
 */
export const validateBurnedAmount = ({
  unsignedTx,
  context,
  upgradesInfo,
  burnedAmount,
  baseFee,
  feeTolerance,
}: {
  unsignedTx: UnsignedTx;
  context: Context;
  upgradesInfo?: GetUpgradesInfoResponse;
  burnedAmount?: bigint;
  baseFee: bigint;
  feeTolerance: number;
}): { isValid: boolean; txFee: bigint } => {
  const tx = unsignedTx.getTx();
  const burned = burnedAmount ?? _getBurnedAmount(tx, context);

  if (
    isEvmImportExportTx(tx) ||
    (upgradesInfo && isEtnaEnabled(upgradesInfo) && isEtnaSupported(tx))
  ) {
    const feeAmount = isEvmImportExportTx(tx)
      ? baseFee * costCorethTx(unsignedTx)
      : calculateFee(tx, context.platformFeeConfig.weights, baseFee);
    return validateDynamicBurnedAmount({
      burnedAmount: burned,
      feeAmount,
      feeTolerance,
    });
  }
  return validateStaticBurnedAmount({
    unsignedTx,
    context,
    burnedAmount: burned,
  });
};
