import { describe, it, expect } from 'vitest';
import { address, addressBytes } from '../../../fixtures/common';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { Address } from './address';

testSerialization('Address', Address, address, addressBytes);

describe('Address.fromString', () => {
  const valid = 'C-avax12sepzg69zg69zg69zg69zg69zg69zg69l25vwz';

  it('accepts a full width address', () => {
    expect(Address.fromString(valid).toBytes().length).toBe(20);
  });

  // A short decode used to be left padded at serialization time, silently
  // producing a different address than the one supplied.
  it('rejects an address that decodes to the wrong width', () => {
    expect(() => Address.fromString('C-avax12sepzg69zg69zg69zgmpqwf3')).toThrow(
      'decoded to 11 bytes, expected 20',
    );
  });
});
