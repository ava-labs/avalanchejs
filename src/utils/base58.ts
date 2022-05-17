import {base58} from '@scure/base';
import type {BytesCoder} from '@scure/base';
import shajs from 'sha.js';

export const base58check: BytesCoder = {
  encode(data) {
    return base58.encode(
      new Uint8Array([
        ...data,
        ...shajs('sha256').update(data).digest().subarray(-4),
      ]),
    );
  },
  decode(string) {
    return base58.decode(string).subarray(0, -4);
  },
};

export {base58} from '@scure/base';
