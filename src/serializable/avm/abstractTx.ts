import { AvaxTx } from '../avax/avaxTx';
import { AVM } from '../constants';

export abstract class AVMTx extends AvaxTx {
  vm = AVM;
}
