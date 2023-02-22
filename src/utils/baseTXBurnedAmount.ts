import type { BaseTx } from '../serializable/avax';
import { transferableAmounts } from './transferableAmounts';

export const baseTxBurnedAmount = (baseTX: BaseTx) => {
  const outAmount = transferableAmounts(baseTX.outputs);
  const inAmount = transferableAmounts(baseTX.inputs);
  const burned = Object.entries(inAmount).reduce((agg, [assetId, amt]) => {
    agg[assetId] = amt - outAmount[assetId] ?? 0n;
    return agg;
  }, {} as Record<string, bigint>);
  return Object.entries(burned)
    .filter(([, amount]) => amount > 0n)
    .reduce(
      (agg, [assetId, amt]) => ({ ...agg, ...{ [assetId]: amt } }),
      {} as Record<string, bigint>,
    );
};
