import { concatBytes } from '../../utils/buffer';
import { describe, it, expect } from 'vitest';

import { address, addressBytes } from '../common';
import { bytesForInt } from './bytesFor';
import { makeList, makeListBytes } from './makeList';

describe('makeList', () => {
  it('make lists', () => {
    expect(makeList(address)()).toEqual([address(), address()]);
  });

  it('make lists bytes', () => {
    expect(makeListBytes(addressBytes)()).toEqual(
      concatBytes(bytesForInt(2), addressBytes(), addressBytes()),
    );
  });
});
