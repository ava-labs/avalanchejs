import { Transaction } from '../../vms/common/transaction';
import type { BaseTx } from '../avax';
import { PVM } from '../constants';

export abstract class PVMTx extends Transaction {
  abstract baseTx?: BaseTx;

  vm = PVM;

  getBlockchainId() {
    return this.baseTx?.BlockchainId.toString() ?? '';
  }
}
