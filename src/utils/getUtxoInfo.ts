import type { Utxo } from '../serializable/avax/utxo';
import { isStakeableLockOut, isTransferOut } from './typeGuards';

export type UtxoInfo = Readonly<{
  /**
   * @default 0n
   */
  amount: bigint;
  assetId: string;
  /**
   * @default 0n
   */
  locktime: bigint;
  /**
   * @default 0n
   */
  stakeableLocktime: bigint;
  /**
   * @default 1
   */
  threshold: number;
  utxoId: string;
}>;

export const getUtxoInfo = (utxo: Utxo): UtxoInfo => {
  const { output } = utxo;
  const outputOwners = utxo.getOutputOwners();

  return {
    amount:
      isTransferOut(output) || isStakeableLockOut(output)
        ? output.amount()
        : 0n,
    assetId: utxo.getAssetId(),
    locktime: outputOwners.locktime.value(),
    stakeableLocktime: isStakeableLockOut(output)
      ? output.getStakeableLocktime()
      : 0n,
    threshold: outputOwners.threshold.value(),
    utxoId: utxo.ID(),
  };
};
