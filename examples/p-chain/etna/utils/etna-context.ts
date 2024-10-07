import { Context, Info } from '../../../../src';
/**
 * Gets the context from URI and then modifies the context
 * to be used for testing example Etna transactions until Etna is enabled.
 */
export const getEtnaContextFromURI = async (
  uri: string,
): Promise<Context.Context> => {
  const context = await Context.getContextFromURI(uri);

  const info = new Info(uri);

  const { etnaTime } = await info.getUpgradesInfo();

  const etnaDateTime = new Date(etnaTime);
  const now = new Date();

  if (etnaDateTime < now) {
    return context;
  }

  // If Etna is not enabled, we need to override the minPrice of 1n that is returned.
  // This is because the minPrice of 1n is not enough to calculate a fee that exceeds the current static fees.
  return {
    ...context,
    platformFeeConfig: {
      ...context.platformFeeConfig,
      minPrice: 10_000n,
    },
  };
};
