import type { SpendOptions, SpendOptionsRequired } from './models';

export const defaultSpendOptions = (
  fromAddress: Uint8Array[],
  options?: SpendOptions,
): SpendOptionsRequired => {
  return {
    minIssuanceTime: BigInt(Math.floor(new Date().getTime() / 1000)),
    changeAddresses: fromAddress,
    threshold: 1,
    memo: new Uint8Array(),
    locktime: 0n,
    ...options,
  };
};
