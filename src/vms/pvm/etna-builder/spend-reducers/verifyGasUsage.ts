import type { SpendReducerFunction } from './types';

/**
 * Verify that gas usage is within limits.
 *
 * Calls the spendHelper's verifyGasUsage method.
 */
export const verifyGasUsage: SpendReducerFunction = (state, spendHelper) => {
  const verifyError = spendHelper.verifyGasUsage();

  if (verifyError) {
    throw verifyError;
  }

  return state;
};
