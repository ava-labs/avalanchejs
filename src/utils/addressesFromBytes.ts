import { Address } from '../serializable/fxs/common';

export function addressesFromBytes(bytes: Uint8Array[]): Address[] {
  return bytes.map((b) => new Address(b));
}
