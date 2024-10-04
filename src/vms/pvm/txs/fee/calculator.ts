import type { Transaction } from '../../../common';
import { dimensionsToGas } from '../../../common/fees/dimensions';
import type { FeeConfig } from '../../models';
import { getTxComplexity } from './complexity';

/**
 * Calculates the minimum required fee, in nAVAX, that an unsigned
 * transaction must pay for valid inclusion into a block.
 */
export const calculateFee = (tx: Transaction, feeConfig: FeeConfig): bigint => {
  const complexity = getTxComplexity(tx);
  const { weights, minPrice } = feeConfig;
  const gas = dimensionsToGas(complexity, weights);

  return gas * minPrice;
};
