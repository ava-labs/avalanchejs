import type { UnsignedTx } from '../vms/common';
import { isImportExportTx as isEvmImportExportTx } from '../serializable/evm';
import { costCorethTx } from './costs';

export const validateEvmBurnedAmount = ({
  unsignedTx,
  burnedAmount,
  baseFee,
  feeTolerance,
}: {
  unsignedTx: UnsignedTx;
  burnedAmount: bigint;
  baseFee: bigint; // fetched from the network and converted into nAvax (https://docs.avax.network/quickstart/transaction-fees#c-chain-fees)
  feeTolerance: number; // tolerance percentage range where the burned amount is considered valid. e.g.: with feeTolerance = 20% -> (baseFee * 0.8 <= burnedAmount <= baseFee * 1.2)
}): { isValid: boolean; txFee: bigint } => {
  const tx = unsignedTx.getTx();

  if (!isEvmImportExportTx(tx)) {
    throw new Error(`tx type is not supported`);
  }

  const feeToleranceInt = Math.floor(feeTolerance);

  if (feeToleranceInt < 1 || feeToleranceInt > 100) {
    throw new Error('feeTolerance must be [1,100]');
  }

  const feeAmount = baseFee * costCorethTx(unsignedTx);
  const min = (feeAmount * (100n - BigInt(feeToleranceInt))) / 100n;
  const max = (feeAmount * (100n + BigInt(feeToleranceInt))) / 100n;

  return {
    isValid: burnedAmount >= min && burnedAmount <= max,
    txFee: burnedAmount,
  };
};
