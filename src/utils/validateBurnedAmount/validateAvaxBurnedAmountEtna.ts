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
} from '../../serializable/pvm';
import type { UnsignedTx } from '../../vms/common';

/**
 * Validate burned amount for post-etna avalanche transactions
 *
 * @param unsignedTx: unsigned transaction
 * @param burnedAmount: burned amount in nAVAX
 * @param baseFee: pvm dynamic fee caculator, https://github.com/ava-labs/avalanchego/blob/master/vms/platformvm/txs/fee/dynamic_calculator.go
 * @param feeTolerance: tolerance percentage range where the burned amount is considered valid. e.g.: with FeeTolerance = 20% -> (expectedFee <= burnedAmount <= expectedFee * 1.2)
 * @return {boolean} isValid: : true if the burned amount is valid, false otherwise.
 * @return {bigint} txFee: burned amount in nAVAX
 */
export const validateAvaxBurnedAmountEtna = ({
  unsignedTx,
  burnedAmount,
  baseFee,
  feeTolerance,
}: {
  unsignedTx: UnsignedTx;
  burnedAmount: bigint;
  baseFee: bigint;
  feeTolerance: number;
}): { isValid: boolean; txFee: bigint } => {
  const tx = unsignedTx.getTx();

  const feeToleranceInt = Math.floor(feeTolerance);

  if (feeToleranceInt < 1 || feeToleranceInt > 100) {
    throw new Error('feeTolerance must be [1,100]');
  }

  const min = baseFee;
  const max = (baseFee * (100n + BigInt(feeToleranceInt))) / 100n;

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
      isValid: burnedAmount >= min && burnedAmount <= max,
      txFee: burnedAmount,
    };
  }

  throw new Error(`tx type is not supported`);
};
