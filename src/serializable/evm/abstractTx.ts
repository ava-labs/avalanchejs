import { Transaction } from '../../vms/common/transaction';
import { EVM } from '../constants';
import type { Id } from '../fxs/common';

export abstract class EVMTx extends Transaction {
  abstract blockchainId: Id;
  vm = EVM;

  getBlockchainId = () => {
    return this.blockchainId.toString();
  };
}
