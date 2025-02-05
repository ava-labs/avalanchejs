import type { Context } from '../../vms/context/model';
import type { UnsignedTx } from '../../vms/common';
import {
  isAvmBaseTx,
  isExportTx as isAvmExportTx,
  isImportTx as isAvmImportTx,
} from '../../serializable/avm';

/**
 * Validate static burned amount for avalanche x transactions
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

  if (isAvmBaseTx(tx) || isAvmExportTx(tx) || isAvmImportTx(tx)) {
    return validate(burnedAmount, context.baseTxFee);
  }

  throw new Error('tx type is not supported');
};

const validate = (burnedAmount: bigint, expectedAmount: bigint) => ({
  isValid: burnedAmount === expectedAmount,
  txFee: expectedAmount,
});
