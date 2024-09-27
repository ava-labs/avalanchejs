import type { SpendReducerFunction } from './types';

/**
 * Verify that all assets have been consumed.
 *
 * Calls the spendHelper's verifyAssetsConsumed method.
 */
export const verifyAssetsConsumed: SpendReducerFunction = (
  state,
  spendHelper,
) => {
  const verifyError = spendHelper.verifyAssetsConsumed();

  if (verifyError) {
    throw verifyError;
  }

  return state;
};
