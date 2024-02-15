import type { Serializable } from '../common/types';
import type { Id } from '../fxs/common';
import type { Input } from '../fxs/secp256k1';
import { PVMTx } from './abstractTx';

export abstract class AbstractSubnetTx extends PVMTx {
  abstract subnetAuth: Serializable;

  abstract getSubnetID(): Id;

  getSubnetAuth() {
    return this.subnetAuth as Input;
  }

  getSigIndices(): number[][] {
    return [
      ...this.getInputs().map((input) => {
        return input.sigIndicies();
      }),
      this.getSubnetAuth().values(),
    ].filter((indicies): indicies is number[] => indicies !== undefined);
  }
}
