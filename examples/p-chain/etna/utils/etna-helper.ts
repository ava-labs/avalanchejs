import { Context, Info, pvm } from '../../../../src';
import type { FeeState } from '../../../../src/vms/pvm';

export const setupEtnaExample = async (
  uri: string,
): Promise<{
  context: Context.Context;
  feeState: FeeState;
  pvmApi: pvm.PVMApi;
}> => {
  const context = await Context.getContextFromURI(uri);
  const pvmApi = new pvm.PVMApi(uri);
  const feeState = await pvmApi.getFeeState();

  const info = new Info(uri);

  const { etnaTime } = await info.getUpgradesInfo();

  const etnaDateTime = new Date(etnaTime);
  const now = new Date();

  if (etnaDateTime >= now) {
    throw new Error(
      `Etna upgrade is not enabled. Upgrade time: ${etnaDateTime}`,
    );
  }

  return {
    context,
    feeState,
    pvmApi,
  };
};
