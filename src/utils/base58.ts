import { base58 } from '@scure/base';
import type { BytesCoder } from '@scure/base';
import { sha256 } from '@noble/hashes/sha256';
import { concatBytes } from './buffer';

export const base58check: BytesCoder = {
  encode(data) {
    return base58.encode(concatBytes(data, sha256(data).subarray(-4)));
  },
  decode(string) {
    return base58.decode(string).subarray(0, -4);
  },
};

export { base58 } from '@scure/base';
