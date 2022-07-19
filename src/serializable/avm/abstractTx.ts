import { Transaction } from '../../vms/common/transaction';
import type { BaseTx } from '../avax';
import { AVM } from '../constants';

export abstract class AVMTx extends Transaction {
  abstract baseTx: BaseTx;

  vm = AVM;

  getBlockchainId() {
    return this.baseTx.BlockchainId.toString();
  }
}
