import { AvaxTx } from '../avax/avaxTx';
import { PVM } from '../constants';

export abstract class PVMTx extends AvaxTx {
  vm = PVM;
}
