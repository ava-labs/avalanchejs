import type { TransferableInput } from '../serializable';
import type { Utxo } from '../serializable/avax/utxo';
import { Address } from '../serializable/fxs/common';
import { addressesFromBytes } from './address';
import { hexToBuffer } from './buffer';
import { matchOwners } from './matchOwners';

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
    return JSON.stringify(Array.from(this.storage.entries()));
  }

  static fromJSON(jsonString: string) {
    const parsed = JSON.parse(jsonString) as [string, number][];
    return new AddressMap(
      parsed.map(([addressHex, idx]) => [Address.fromHex(addressHex), idx]),
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

  forEachHex(cb: (value: number, key: string) => void) {
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
  push(...addressMaps: AddressMap[]) {
    addressMaps.forEach((addressMap) => {
      addressMap.forEachHex((index, addressHex) => {
        this.index[addressHex] = this.index[addressHex] ?? [];
        this.index[addressHex].push([this.storage.length, index]);
      });
      this.storage.push(addressMap);
    });
  }

  // this is a stopgap to quickly fix AddressMap not deriving the order post sorting TransferableInputs. Can probably
  // be simplified a lot by just deriving the sigIndicies right before returning the unsingedTx
  static fromTransferableInputs(
    inputs: TransferableInput[],
    inputUtxos: Utxo[],
    fromAddressesBytes: Uint8Array[],
    minIssuanceTime: bigint,
  ) {
    const utxoMap = inputUtxos.reduce((agg, utxo) => {
      return agg.set(utxo.utxoId.ID(), utxo);
    }, new Map<string, Utxo>());
    const fromAddresses = addressesFromBytes(fromAddressesBytes);

    const addressMaps = inputs.map((input, i) => {
      const utxo = utxoMap.get(input.utxoID.ID());
      if (!utxo) throw new Error('input utxo not found');
      const sigData = matchOwners(
        utxo.getOutputOwners(),
        fromAddresses,
        minIssuanceTime,
      );

      if (!sigData) {
        throw new Error(`input ${i} has no valid owners`);
      }
      return sigData.addressMap;
    });

    return new AddressMaps(addressMaps);
  }

  toJSON() {
    return JSON.stringify(this.storage);
  }

  static fromJSON(jsonString: string) {
    const addressMaps = JSON.parse(jsonString);
    return new AddressMaps(addressMaps.map((map) => AddressMap.fromJSON(map)));
  }

  getAddresses(): Uint8Array[] {
    return Object.keys(this.index).map((hex) => hexToBuffer(hex));
  }

  forEach(cb: (coordinates: [number, number][], address: string) => void) {
    Object.entries(this.index).forEach(([address, coordinates]) => {
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

  getSigIndicesForAddress(address: Address) {
    return this.index[address.toHex()];
  }
}
