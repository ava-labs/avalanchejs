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
 * @param expectedFee: optional. The fee the caller expects to be burned, in
 * nAVAX. Supply this whenever `context` was built from the same node that
 * produced the transaction: `context.baseTxFee` is that node's own
 * `avm.getTxFee` answer, so comparing the burn against it is a tautology that
 * reports `isValid` for any inflated fee. A per-network constant or a
 * caller-configured figure is an expectation the node cannot move.
 * @return {boolean} isValid: : true if the burned amount is valid, false otherwise.
 * @return {bigint} txFee: burned amount in nAVAX
 */
export const validateStaticBurnedAmount = ({
  unsignedTx,
  context,
  burnedAmount,
  expectedFee,
}: {
  unsignedTx: UnsignedTx;
  context: Context;
  burnedAmount: bigint;
  expectedFee?: bigint;
}): { isValid: boolean; txFee: bigint } => {
  const tx = unsignedTx.getTx();

  if (isAvmBaseTx(tx) || isAvmExportTx(tx) || isAvmImportTx(tx)) {
    return validate(burnedAmount, expectedFee ?? context.baseTxFee);
  }

  throw new Error('tx type is not supported');
};

const validate = (burnedAmount: bigint, expectedAmount: bigint) => ({
  isValid: burnedAmount === expectedAmount,
  txFee: expectedAmount,
});
