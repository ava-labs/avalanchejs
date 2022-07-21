import { printDeep } from '../utils';
import { AVMApi } from '../vms/avm';
import type { AvaxApi } from '../vms/common/avaxApi';
import { EVMApi } from '../vms/evm';
import { PVMApi } from '../vms/pvm/api';

export const compareTxAVM = async (txId: string) => {
  const api = new AVMApi();
  await compareTxAvax(txId, api);
};

export const compareTxPVM = async (txId: string) => {
  const api = new PVMApi();
  await compareTxAvax(txId, api);
};

const compareTxAvax = async (txID: string, api: AvaxApi) => {
  printDeep(await api.getTxJson({ txID }));
  printDeep(
    await api.getTx({
      txID,
    }),
  );
};

export const printTxAtomic = async (txID: string) => {
  printDeep(
    await new EVMApi().getAtomicTx({
      txID: txID,
    }),
  );
};
