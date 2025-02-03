import { createDimensions } from '../vms/common/fees/dimensions';
import type { Context } from '../vms/context';

export const testContext: Context = {
  xBlockchainID: '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
  pBlockchainID: '11111111111111111111111111111111LpoYY',
  cBlockchainID: '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
  avaxAssetID: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
  baseTxFee: 1000000n,
  createAssetTxFee: 10000000n,
  networkID: 1,
  hrp: 'avax',
  platformFeeConfig: {
    weights: createDimensions({
      bandwidth: 1,
      dbRead: 1,
      dbWrite: 1,
      compute: 1,
    }),
    maxCapacity: 1_000_000n,
    maxPerSecond: 1_000n,
    targetPerSecond: 500n,
    minPrice: 1n,
    excessConversionConstant: 5_000n,
  },
};
