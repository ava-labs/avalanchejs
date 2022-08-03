import type { Address } from '../serializable/fxs/common';
import type { OutputOwners } from '../serializable/fxs/secp256k1';
import { AddressMap } from './addressMap';

export const matchOwners = (
  owners: OutputOwners,
  inputAddrs: Address[],
  minIssuanceTime: bigint,
): { sigIndicies: number[]; addressMap: AddressMap } | undefined => {
  if (owners.locktime.value() > minIssuanceTime) {
    return undefined;
  }
  const inputAddrSet = new Set(inputAddrs.map((a) => a.toString()));
  const addressMap = owners.addrs.reduce((agg, addr, i) => {
    if (
      agg.size() < owners.threshold.value() &&
      inputAddrSet.has(addr.value())
    ) {
      return agg.set(addr, i);
    }
    return agg;
  }, new AddressMap());

  if (addressMap.size() < owners.threshold.value()) {
    return undefined;
  }
  return {
    sigIndicies: Array.from(addressMap.values()),
    addressMap: addressMap,
  };
};
