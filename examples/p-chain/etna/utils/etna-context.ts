import { Context } from '../../../../src';

/**
 * Gets the context from URI and then modifies the context
 * to be used for testing example Etna transactions until Etna is enabled.
 */
export const getEtnaContextFromURI = async (
  uri: string,
): Promise<Context.Context> => {
  const context = await Context.getContextFromURI(uri);

  return context;
};
