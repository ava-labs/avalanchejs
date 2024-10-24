import type { OutputOwners, TransferableInput } from '../serializable';
import type { Utxo } from '../serializable/avax/utxo';
import { Address } from '../serializable/fxs/common';
import { addressesFromBytes } from './addressesFromBytes';
import { hexToBuffer } from './buffer';

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

export class AddressMap {
  constructor(initialData: [Address, number][] = []) {
    initialData.forEach(([address, num]) => {
      this.set(address, num);
    });
  }

  storage = new Map<string, number>();

  set(add: Address, item: number) {
    this.storage.set(add.toHex(), item);
    return this;
  }

  toJSON() {
    return Array.from(this.storage.entries());
  }

  static fromJSON(maps: [string, number][]) {
    return new AddressMap(
      maps.map(([addressHex, idx]) => [Address.fromHex(addressHex), idx]),
    );
  }

  get(add: Address): number | undefined {
    return this.storage.get(add.toHex());
  }

  has(add: Address): boolean {
    return this.storage.has(add.toHex());
  }

  size() {
    return this.storage.size;
  }

  forEach(cb: (value: number, key: Address) => void) {
    return this.storage.forEach((val, key) => cb(val, Address.fromHex(key)));
  }

  forEachHex(
    cb: (value: number, key: string) => void,
    shouldReorderWithoutGaps = false,
  ) {
    // reorder the sigindices, so they start from index 0, without gaps
    if (shouldReorderWithoutGaps) {
      return AddressMap.fromJSON(
        [...this.storage.entries()]
          .sort((a, b) => a[1] - b[1])
          .map(([addressHex], index) => [addressHex, index]),
      ).storage.forEach(cb);
    }

    return this.storage.forEach(cb);
  }

  values() {
    return this.storage.values();
  }
}

export class AddressMaps {
  constructor(addressMaps: AddressMap[] = []) {
    if (addressMaps.length) {
      this.push(...addressMaps);
    }
  }

  private storage: AddressMap[] = [];
  private index: Record<string, [number, number][]> = {};
  private orderedIndex: Record<string, [number, number][]> = {};

  push(...addressMaps: AddressMap[]) {
    addressMaps.forEach((addressMap) => {
      addressMap.forEachHex((index, addressHex) => {
        this.index[addressHex] = this.index[addressHex] ?? [];
        this.index[addressHex].push([this.storage.length, index]);
      });

      addressMap.forEachHex((index, addressHex) => {
        this.orderedIndex[addressHex] = this.orderedIndex[addressHex] ?? [];
        this.orderedIndex[addressHex].push([this.storage.length, index]);
      }, true);

      this.storage.push(addressMap);
    });
  }

  // this is a stopgap to quickly fix AddressMap not deriving the order post sorting TransferableInputs. Can probably
  // be simplified a lot by just deriving the sigIndicies right before returning the unsingedTx
  static fromTransferableInputs(
    inputs: readonly TransferableInput[],
    inputUtxos: readonly Utxo[],
    minIssuanceTime: bigint,
    fromAddressesBytes?: readonly Uint8Array[],
  ) {
    const utxoMap = inputUtxos.reduce((agg, utxo) => {
      return agg.set(utxo.utxoId.ID(), utxo);
    }, new Map<string, Utxo>());

    const addressMaps = inputs.map((input, i) => {
      const utxo = utxoMap.get(input.utxoID.ID());
      if (!utxo) throw new Error('input utxo not found');

      if (fromAddressesBytes) {
        const fromAddresses = addressesFromBytes(fromAddressesBytes);

        const sigData = matchOwners(
          utxo.getOutputOwners(),
          fromAddresses,
          minIssuanceTime,
          input.sigIndicies(), // we care about signers only
        );

        if (!sigData) {
          throw new Error(`input ${i} has no valid owners`);
        }
        return sigData.addressMap;
      }

      // in case fromAddressesBytes were not provided,
      // get the them from the provided UTXOs using the inputs' signature indices
      const addressMapData = input.sigIndicies().map((sigIndex) => {
        const address = utxo.getOutputOwners().addrs[sigIndex];
        return [address, sigIndex] as [Address, number];
      });

      return new AddressMap(addressMapData);
    });

    return new AddressMaps(addressMaps);
  }

  toJSON() {
    return this.storage;
  }

  static fromJSON(addressMaps: [string, number][][]) {
    return new AddressMaps(addressMaps.map((map) => AddressMap.fromJSON(map)));
  }

  getAddresses(): Uint8Array[] {
    return Object.keys(this.index).map((hex) => hexToBuffer(hex));
  }

  forEach(
    cb: (coordinates: [number, number][], address: string) => void,
    useReorderedIndices = false,
  ) {
    Object.entries(
      useReorderedIndices ? this.orderedIndex : this.index,
    ).forEach(([address, coordinates]) => {
      cb(coordinates, address);
    });
  }

  has(address: Address): boolean {
    return address.toHex() in this.index;
  }

  toArray() {
    return this.storage;
  }

  merge(newMap: AddressMaps) {
    newMap.toArray().forEach((map) => this.push(map));
  }

  getSigIndicesForAddress(address: Address, useReorderedIndices = false) {
    if (useReorderedIndices) {
      return this.orderedIndex[address.toHex()];
    }

    return this.index[address.toHex()];
  }
}
