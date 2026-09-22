import { describe, it, expect } from 'vitest';
import { int, intBytes } from '../../fixtures/primitives';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Int } from './int';

testSerialization('Int', Int, int, intBytes);

describe('Int bounds', () => {
  it('encodes the maximum value in 4 bytes', () => {
    expect(new Int(4_294_967_295).toBytes()).toStrictEqual(
      new Uint8Array([0xff, 0xff, 0xff, 0xff]),
    );
  });

  it('throws rather than emitting an oversized field', () => {
    expect(() => new Int(4_294_967_296).toBytes()).toThrow(
      'Int is too large for a 4 byte field',
    );
  });

  it('throws on negative values', () => {
    expect(() => new Int(-1).toBytes()).toThrow('Int must not be negative');
  });

  it('throws when decoding a short buffer', () => {
    expect(() => Int.fromBytes(new Uint8Array([0x01, 0x02]))).toThrow(
      'unexpected end of input decoding Int: need 4 bytes, have 2',
    );
    expect(() => Int.fromBytes(new Uint8Array([]))).toThrow(
      'unexpected end of input decoding Int: need 4 bytes, have 0',
    );
  });
});
