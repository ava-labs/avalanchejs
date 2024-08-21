import { Transaction } from '../../vms/common/transaction';
import type { BaseTx } from './baseTx';
import type { TransferableInput } from './transferableInput';

export abstract class AvaxTx extends Transaction {
  abstract baseTx?: BaseTx;

  getInputs(): readonly TransferableInput[] {
    return this.baseTx?.inputs ?? [];
  }
  getBlockchainId() {
    return this.baseTx?.BlockchainId.toString() ?? '';
  }

  getSigIndices(): number[][] {
    return this.getInputs()
      .map((input) => {
        return input.sigIndicies();
      })
      .filter((indicies): indicies is number[] => indicies !== undefined);
  }
}
