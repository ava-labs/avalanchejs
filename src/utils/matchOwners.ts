import type { Address } from '../serializable/fxs/common';
import type { OutputOwners } from '../serializable/fxs/secp256k1';
import { AddressMap } from './addressMap';

export type MatchOwnerResult = {
  sigIndicies: number[];
  addressMap: AddressMap;
};
export const matchOwners = (
  owners: OutputOwners,
  inputAddrs: Address[],
  minIssuanceTime: bigint,
  sigindices?: number[],
): MatchOwnerResult | undefined => {
  if (owners.locktime.value() > minIssuanceTime) {
    return undefined;
  }

  const inputAddrSet = new Set(inputAddrs.map((a) => a.toString()));
  const addressMap = owners.addrs.reduce((agg, addr, i) => {
    if (
      agg.size() < owners.threshold.value() &&
      inputAddrSet.has(addr.value())
    ) {
      // only add actual signer addresses if sigindices are known
      if (sigindices?.length && !sigindices.includes(i)) {
        return agg;
      }

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
