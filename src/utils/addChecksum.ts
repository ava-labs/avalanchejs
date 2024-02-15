import { sha256 } from '@noble/hashes/sha256';
import { concatBytes } from './buffer';

export function addChecksum(data: Uint8Array) {
  return concatBytes(data, sha256(data).subarray(-4));
}
