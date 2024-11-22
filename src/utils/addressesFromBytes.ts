import { Address } from '../serializable/fxs/common';

export function addressesFromBytes(bytes: readonly Uint8Array[]): Address[] {
  return bytes.map((b) => new Address(b));
}
