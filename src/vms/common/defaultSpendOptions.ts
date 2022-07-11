import type { SpendOptions, SpendOptionsRequired } from './models';

export const defaultSpendOptions = (
  fromAddress: string[],
  options?: SpendOptions,
): SpendOptionsRequired => {
  return {
    minIssuanceTime: BigInt(Math.floor(new Date().getTime() / 100)),
    changeAddresses: fromAddress,
    threashold: 1,
    memo: new Uint8Array(),
    locktime: 0n,
    ...options,
  };
};
