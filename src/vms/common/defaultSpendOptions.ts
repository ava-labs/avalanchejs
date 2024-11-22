import type { SpendOptions, SpendOptionsRequired } from './models';

export const defaultSpendOptions = (
  fromAddress: readonly Uint8Array[],
  options?: SpendOptions,
): SpendOptionsRequired => {
  return {
    minIssuanceTime: BigInt(Math.floor(new Date().getTime() / 1000)),
    changeAddresses: fromAddress,
    threshold: 1,
    memo: new Uint8Array(),
    locktime: 0n,
    // Only include options that are not undefined
    ...Object.fromEntries(
      Object.entries(options || {}).filter(([, v]) => v !== undefined),
    ),
  };
};
