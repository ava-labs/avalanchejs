import { createDimensions } from '../vms/common/fees/dimensions';
import type { FeeConfig } from '../vms/pvm';

export const testFeeConfig: FeeConfig = {
  weights: createDimensions({
    bandwidth: 1,
    dbRead: 1,
    dbWrite: 1,
    compute: 1,
  }),
  maxCapacity: 1000000n, // Maximum amount of gas the chain is allowed to consume.
  maxPerSecond: 1000n, // Maximum amount of gas the chain is allowed to consume per second.
  targetPerSecond: 500n, // Target amount of gas the chain should consume per second to keep the fees stable.
  minPrice: 1n, // Minimum gas price.
  excessConversionConstant: 5000n, // Excess conversion constant.
};
