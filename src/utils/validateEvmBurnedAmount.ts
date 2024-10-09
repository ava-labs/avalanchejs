import type { UnsignedTx } from '../vms/common';
import { isImportExportTx as isEvmImportExportTx } from '../serializable/evm';
import { costCorethTx } from './costs';

export const validateEvmBurnedAmount = ({
  unsignedTx,
  burnedAmount,
  evmBaseFee,
  evmFeeTolerance,
}: {
  unsignedTx: UnsignedTx;
  burnedAmount: bigint;
  evmBaseFee?: bigint; // fetched from the network and converted into nAvax (https://docs.avax.network/quickstart/transaction-fees#c-chain-fees)
  evmFeeTolerance?: number; // tolerance percentage range where the burned amount is considered valid. e.g.: with evmFeeTolerance = 20% -> (evmBaseFee * 0.8 <= burnedAmount <= evmBaseFee * 1.2)
}): { isValid: boolean; txFee: bigint } => {
  const tx = unsignedTx.getTx();

  if (!isEvmImportExportTx(tx)) {
    throw new Error(`tx type is not supported`);
  }
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
    isValid: burnedAmount >= min && burnedAmount <= max,
    txFee: burnedAmount,
  };
};
