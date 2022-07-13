import type { Amounter } from '../serializable/common/types';

export interface TransferableSummable extends Amounter {
  getAssetId(): string;
}

export const transferableAmounts = (transferables: TransferableSummable[]) => {
  return transferables.reduce((agg, transferable) => {
    agg[transferable.getAssetId()] = agg[transferable.getAssetId()] ?? 0n;
    agg[transferable.getAssetId()] += transferable.amount();
    return agg;
  }, {} as Record<string, bigint>);
};
