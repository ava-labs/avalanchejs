import { getAVMManager } from '../serializable/avm/codec';
import type { Manager } from '../serializable/codec';
import type { VM } from '../serializable/constants';
import { getEVMManager } from '../serializable/evm/codec';
import { getPVMManager } from '../serializable/pvm/codec';
import type { Transaction } from '../vms/common/transaction';

const getManagerForVM = (vm: VM): Manager => {
  switch (vm) {
    case 'AVM':
      return getAVMManager();
    case 'EVM':
      return getEVMManager();
    case 'PVM':
      return getPVMManager();
    default:
      throw new Error('unknown VM');
  }
};

export const packTx = (tx: Transaction) => {
  return getManagerForVM(tx.vm).packCodec(tx);
};
