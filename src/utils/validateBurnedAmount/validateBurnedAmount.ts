import type { Context } from '../../vms/context/model';
import type { Transaction, UnsignedTx } from '../../vms/common';
import type { EVMTx } from '../../serializable/evm';
import { isImportExportTx as isEvmImportExportTx } from '../../serializable/evm';
import { getBurnedAmountByTx } from '../getBurnedAmountByTx';
import type { AvaxTx } from '../../serializable/avax';
import { validateEvmBurnedAmount } from './validateEvmBurnedAmount';
import type { GetUpgradesInfoResponse } from '../../info/model';
import { isEtnaEnabled } from '../isEtnaEnabled';
import { validateAvaxBurnedAmountEtna } from './validateAvaxBurnedAmountEtna';
import { validateAvaxBurnedAmountPreEtna } from './validateAvaxBurnedAmountPreEtna';
import {
  isAvmBaseTx,
  isExportTx as isAvmExportTx,
  isImportTx as isAvmImportTx,
} from '../../serializable/avm';
import {
  isAddDelegatorTx,
  isAddValidatorTx,
  isTransformSubnetTx,
} from '../../serializable/pvm';

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

/**
 * Validate burned amount for avalanche transactions
 *
 * @param unsignedTx: unsigned transaction
 * @param burnedAmount: burned amount in nAVAX
 * @param baseFee
 ** c-chain: fetched from the network and converted into nAvax (https://docs.avax.network/quickstart/transaction-fees#c-chain-fees)
 ** x/p-chain: pvm dynamic fee caculator, https://github.com/ava-labs/avalanchego/blob/master/vms/platformvm/txs/fee/dynamic_calculator.go
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
  upgradesInfo: GetUpgradesInfoResponse;
  burnedAmount?: bigint;
  baseFee: bigint;
  feeTolerance: number; // tolerance percentage range where the burned amount is considered valid.
}): { isValid: boolean; txFee: bigint } => {
  const tx = unsignedTx.getTx();
  const burned = burnedAmount ?? _getBurnedAmount(tx, context);

  if (isEvmImportExportTx(tx)) {
    return validateEvmBurnedAmount({
      unsignedTx,
      burnedAmount: burned,
      baseFee,
      feeTolerance,
    });
  }
  if (isEtnaEnabled(upgradesInfo) || !isPreEtnaTx(tx)) {
    return validateAvaxBurnedAmountEtna({
      unsignedTx,
      baseFee,
      burnedAmount: burned,
      feeTolerance,
    });
  }
  return validateAvaxBurnedAmountPreEtna({
    unsignedTx,
    context,
    burnedAmount: burned,
  });
};
