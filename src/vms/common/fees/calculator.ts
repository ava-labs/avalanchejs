import type { Dimensions } from './dimensions';
import { toGas } from './dimensions';

export type GasConfig = {
  gasPrice: bigint;
  gasCap: bigint;
  weights: Dimensions;
};

export const calculateFees = (
  complexities: Dimensions,
  gasConfig: GasConfig,
): bigint => {
  const gas = toGas(complexities, gasConfig.weights);
  if (gas > gasConfig.gasCap) {
    throw new Error('gas exceeds gasCap');
  }
  const fee = gas * gasConfig.gasPrice;
  return fee;
};
