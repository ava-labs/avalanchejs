import type { Transaction } from '../../../common';
import {
  dimensionsToGas,
  type Dimensions,
} from '../../../common/fees/dimensions';
import { getTxComplexity } from './complexity';

/**
 * Calculates the minimum required fee, in nAVAX, that an unsigned
 * transaction must pay for valid inclusion into a block.
 */
export const calculateFee = (
  // TODO: Do we need this to be UnsignedTx?
  // If so, we can use .getTx() to get the Transaction.
  tx: Transaction,
  weights: Dimensions,
  price: bigint,
): bigint => {
  const complexity = getTxComplexity(tx);

  const gas = dimensionsToGas(complexity, weights);

  return gas * price;
};
