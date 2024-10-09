import type { Context } from '../vms/context/model';
import type { Transaction, UnsignedTx } from '../vms/common';
import type { EVMTx } from '../serializable/evm';
import { isImportExportTx as isEvmImportExportTx } from '../serializable/evm';
import { getBurnedAmountByTx } from './getBurnedAmountByTx';
import type { AvaxTx } from '../serializable/avax';
import type { FeeState } from '../vms/pvm';
import { validateEvmBurnedAmount } from './validateEvmBurnedAmount';
import type { GetUpgradesInfoResponse } from '../info/model';
import { isEtnaEnabled } from './isEtnaEnabled';
import { validateAvaxBurnedAmountEtna } from './validateAvaxBurnedAmountEtna';
import { validateAvaxBurnedAmountPreEtna } from './validateAvaxBurnedAmountPreEtna';
import {
  isAvmBaseTx,
  isExportTx as isAvmExportTx,
  isImportTx as isAvmImportTx,
} from '../serializable/avm';
import {
  isAddDelegatorTx,
  isAddValidatorTx,
  isTransformSubnetTx,
} from '../serializable/pvm';

const _getBurnedAmount = (tx: Transaction, context: Context) => {
  const burnedAmounts = getBurnedAmountByTx(tx as AvaxTx | EVMTx);
  return burnedAmounts.get(context.avaxAssetID) ?? 0n;
};

// Transactions that are deprecated or not implemented for Etna
// Todo: remove isAvmBaseTx, isAvmExportTx and isAvmImportTx when avm dynmamic fee is implemented
const isPreEtnaTx = (tx: Transaction) => {
  return (
    isAvmBaseTx(tx) || // not implemented
    isAvmExportTx(tx) || // not implemented
    isAvmImportTx(tx) || // not implemented
    isAddValidatorTx(tx) || // deprecated
    isAddDelegatorTx(tx) || // deprecated
    isTransformSubnetTx(tx) // deprecated
  );
};

export const validateBurnedAmount = ({
  unsignedTx,
  context,
  feeState,
  upgradesInfo,
  burnedAmount,
  evmBaseFee,
  evmFeeTolerance,
}: {
  unsignedTx: UnsignedTx;
  context: Context;
  feeState: FeeState;
  upgradesInfo: GetUpgradesInfoResponse;
  burnedAmount?: bigint;
  evmBaseFee?: bigint; // fetched from the network and converted into nAvax (https://docs.avax.network/quickstart/transaction-fees#c-chain-fees)
  evmFeeTolerance?: number; // tolerance percentage range where the burned amount is considered valid. e.g.: with evmFeeTolerance = 20% -> (evmBaseFee * 0.8 <= burnedAmount <= evmBaseFee * 1.2)
}): { isValid: boolean; txFee: bigint } => {
  const tx = unsignedTx.getTx();
  const burned = burnedAmount ?? _getBurnedAmount(tx, context);

  if (isEvmImportExportTx(tx)) {
    return validateEvmBurnedAmount({
      unsignedTx,
      burnedAmount: burned,
      evmBaseFee,
      evmFeeTolerance,
    });
  }
  if (isEtnaEnabled(upgradesInfo) || !isPreEtnaTx(tx)) {
    return validateAvaxBurnedAmountEtna({
      unsignedTx,
      context,
      burnedAmount: burned,
      feeState,
    });
  }
  return validateAvaxBurnedAmountPreEtna({
    unsignedTx,
    context,
    burnedAmount: burned,
  });
};
