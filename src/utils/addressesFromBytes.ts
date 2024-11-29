import { Address } from '../serializable/fxs/common';
import { bytesCompare } from './bytesCompare';

export function addressesFromBytes(bytes: readonly Uint8Array[]): Address[] {
  const sortedBytes = bytes.toSorted(bytesCompare);
  return sortedBytes.map((b) => new Address(b));
}
