import { describe, it, expect } from 'vitest';
import { bool, boolBytes } from '../../fixtures/primitives';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Bool } from './boolean';

testSerialization('Bool', Bool, bool, boolBytes);

describe('Bool canonicalization', () => {
  it('decodes the two canonical encodings', () => {
    expect(Bool.fromBytes(new Uint8Array([0x00]))[0].value()).toBe(false);
    expect(Bool.fromBytes(new Uint8Array([0x01]))[0].value()).toBe(true);
  });

  // Previously any byte other than 1 decoded to false, so a non-canonical
  // encoding round tripped to different bytes.
  it.each([0x02, 0x7f, 0xff])('rejects the non-canonical byte %i', (value) => {
    expect(() => Bool.fromBytes(new Uint8Array([value]))).toThrow(
      `invalid bool: expected 0 or 1, got ${value}`,
    );
  });

  it('throws when decoding an empty buffer', () => {
    expect(() => Bool.fromBytes(new Uint8Array())).toThrow(
      'unexpected end of input decoding Bool: need 1 bytes, have 0',
    );
  });
});
