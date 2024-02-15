import type { Context } from '../vms/context';

export const testContext: Context = {
  xBlockchainID: '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
  pBlockchainID: '11111111111111111111111111111111LpoYY',
  cBlockchainID: '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
  avaxAssetID: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
  baseTxFee: 1000000n,
  createAssetTxFee: 10000000n,
  createSubnetTxFee: 1000000000n,
  transformSubnetTxFee: 10000000000n,
  createBlockchainTxFee: 1000000000n,
  addPrimaryNetworkValidatorFee: 0n,
  addPrimaryNetworkDelegatorFee: 0n,
  addSubnetValidatorFee: 1000000n,
  addSubnetDelegatorFee: 1000000n,
  networkID: 1,
  hrp: 'avax',
};
