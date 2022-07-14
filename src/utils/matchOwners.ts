import type { OutputOwners } from '../serializable/fxs/secp256k1';
import { Int } from '../serializable/primitives';

export const matchOwners = (
  owners: OutputOwners,
  inputAddrs: Set<string>,
  minIssuanceTime: bigint,
): Int[] | undefined => {
  if (owners.locktime.value() > minIssuanceTime) {
    return undefined;
  }
  const qualified = owners.addrs.reduce((agg, addr, i) => {
    if (agg.length < owners.threshold.value() && inputAddrs.has(addr.value())) {
      agg.push(new Int(i));
      return agg;
    }
    return agg;
  }, [] as Int[]);

  if (qualified.length < owners.threshold.value()) {
    return undefined;
  }
  return qualified;
};
