import { Transaction } from '../../vms/common/transaction';
import type { BaseTx } from './baseTx';
import type { TransferableInput } from './transferableInput';

export abstract class AvaxTx extends Transaction {
  abstract baseTx?: BaseTx;

  getInputs(): TransferableInput[] {
    return this.baseTx?.inputs ?? [];
  }
  getBlockchainId() {
    return this.baseTx?.BlockchainId.toString() ?? '';
  }

  getSigIndices(): number[][] {
    return this.getInputs()
      .map((input) => {
        try {
          return input.sigIndicies();
        } catch (e) {
          return;
        }
      })
      .filter((indicies): indicies is number[] => indicies !== undefined);
  }
}
