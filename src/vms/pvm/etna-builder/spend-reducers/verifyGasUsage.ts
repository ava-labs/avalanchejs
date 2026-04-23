import type { SpendReducerFunction } from './types';

const DEFAULT_LOCAL_DEVNET_ID = 12345;

/**
 * Verify that gas usage is within limits.
 *
 * Calls the spendHelper's verifyGasUsage method.
 */
export const verifyGasUsage: SpendReducerFunction = (
  state,
  spendHelper,
  context,
) => {
  const verifyError = spendHelper.verifyGasUsage(
    context.networkID === DEFAULT_LOCAL_DEVNET_ID,
  );

  if (verifyError) {
    throw verifyError;
  }

  return state;
};
