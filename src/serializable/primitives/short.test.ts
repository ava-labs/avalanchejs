import { describe, it, expect } from 'vitest';
import { short, shortBytes } from '../../fixtures/primitives';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Short } from './short';

testSerialization('Short', Short, short, shortBytes);

describe('Short bounds', () => {
  it('encodes the maximum value in 2 bytes', () => {
    expect(new Short(65_535).toBytes()).toStrictEqual(
      new Uint8Array([0xff, 0xff]),
    );
  });

  it('throws rather than emitting an oversized field', () => {
    expect(() => new Short(65_536).toBytes()).toThrow(
      'Short is too large for a 2 byte field',
    );
  });

  it('throws when decoding a short buffer', () => {
    expect(() => Short.fromBytes(new Uint8Array([0x01]))).toThrow(
      'unexpected end of input decoding Short: need 2 bytes, have 1',
    );
  });
});
