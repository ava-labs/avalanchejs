import { describe, it, expect } from 'vitest';
import { bytes, bytesBytes } from '../../fixtures/primitives';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Bytes } from './bytes';

testSerialization('Bytes', Bytes, bytes, bytesBytes);

describe('Bytes length prefix', () => {
  // The prefix is attacker controlled; slicing past the end used to silently
  // yield a shorter payload instead of rejecting the input.
  it('throws when the declared length exceeds the payload', () => {
    const overDeclared = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xaa, 0xbb]);

    expect(() => Bytes.fromBytes(overDeclared)).toThrow(
      'unexpected end of input decoding Bytes: need 4294967295 bytes, have 2',
    );
  });

  it('throws when the length prefix itself is truncated', () => {
    expect(() => Bytes.fromBytes(new Uint8Array([0x00, 0x01]))).toThrow(
      'unexpected end of input decoding Int: need 4 bytes, have 2',
    );
  });
});
