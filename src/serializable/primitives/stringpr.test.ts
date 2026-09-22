import { describe, it, expect } from 'vitest';
import { stringPr, stringPrBytes } from '../../fixtures/primitives';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Stringpr } from './stringpr';

testSerialization('Stringpr', Stringpr, stringPr, stringPrBytes);

describe('Stringpr non-ascii', () => {
  // The length prefix counts UTF-8 bytes. Using `string.length` (UTF-16 code
  // units) desynchronized the prefix from the payload and shifted every
  // following field in the transaction.
  it.each([
    ['cafe\u0301', 6],
    ['caf\u00e9', 5],
    ['\u65e5\u672c\u8a9e', 9],
    ['\ud83d\ude80x', 5],
  ])('prefixes %s with its utf-8 byte length', (value, byteLength) => {
    const bytes = new Stringpr(value).toBytes();

    expect((bytes[0] << 8) | bytes[1]).toBe(byteLength);
    expect(bytes.length - 2).toBe(byteLength);
  });

  it.each(['caf\u00e9', '\u65e5\u672c\u8a9e', '\ud83d\ude80x', 'ascii'])(
    'round trips %s with no leftover bytes',
    (value) => {
      const [decoded, remainder] = Stringpr.fromBytes(
        new Stringpr(value).toBytes(),
      );

      expect(decoded.value()).toBe(value);
      expect(remainder).toStrictEqual(new Uint8Array());
    },
  );

  it('throws when the string does not fit the 2 byte length prefix', () => {
    expect(() => new Stringpr('a'.repeat(70_000)).toBytes()).toThrow(
      'Stringpr length is too large for a 2 byte field',
    );
  });

  it('throws when the payload is shorter than the declared length', () => {
    // declares 4 bytes, supplies 2
    const truncated = new Uint8Array([0x00, 0x04, 0x41, 0x76]);

    expect(() => Stringpr.fromBytes(truncated)).toThrow(
      'unexpected end of input decoding Stringpr: need 4 bytes, have 2',
    );
  });
});
