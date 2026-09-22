import { describe, it, expect } from 'vitest';
import { byte, byteByte } from '../../fixtures/primitives';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Byte } from './byte';

testSerialization('Byte', Byte, byte, byteByte);

describe('Byte bounds', () => {
  it('throws rather than emitting an oversized field', () => {
    expect(() =>
      new Byte(new Uint8Array([0x01, 0x02, 0x03])).toBytes(),
    ).toThrow('Byte is 3 bytes, expected at most 1');
  });

  it('throws when decoding an empty buffer', () => {
    expect(() => Byte.fromBytes(new Uint8Array())).toThrow(
      'unexpected end of input decoding Byte: need 1 bytes, have 0',
    );
  });
});
