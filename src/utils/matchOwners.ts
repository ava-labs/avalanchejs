import type { OutputOwners } from '../fxs/secp256k1';

export const matchOwners = (
  owners: OutputOwners,
  inputAddrs: Set<string>,
  minIssuanceTime: bigint,
): number[] | undefined => {
  if (owners.locktime.value() > minIssuanceTime) {
    return undefined;
  }
  const qualified = owners.addrs.reduce((agg, addr, i) => {
    if (agg.length < owners.threshold.value() && inputAddrs.has(addr.value())) {
      agg.push(i);
      return agg;
    }
    return agg;
  }, [] as number[]);

  if (qualified.length < owners.threshold.value()) {
    return undefined;
  }
  return qualified;
};
