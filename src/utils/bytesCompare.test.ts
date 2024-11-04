import { bytesCompare, bytesEqual } from './bytesCompare';
import { describe, it, expect } from 'vitest';

describe('bytesCompare', () => {
  it('compares bytes', () => {
    const specs = [
      {
        bytes1: new Uint8Array([0, 0, 0, 0, 0, 1]),
        bytes2: new Uint8Array([0, 0, 0, 0, 0, 0]),
        expected: 1,
      },
      {
        bytes1: new Uint8Array([0, 0, 0, 0, 0, 0]),
        bytes2: new Uint8Array([0, 0, 0, 0, 0, 1]),
        expected: -1,
      },
      {
        bytes1: new Uint8Array([0, 0, 0, 0, 0, 1]),
        bytes2: new Uint8Array([1, 0, 0, 0, 0, 0]),
        expected: -1,
      },
      {
        bytes1: new Uint8Array([0, 0, 0, 0, 0, 0]),
        bytes2: new Uint8Array([0, 0, 0, 0, 0, 0]),
        expected: 0,
      },
    ];

    specs.forEach(({ bytes1, bytes2, expected }) => {
      expect(bytesCompare(bytes1, bytes2)).toBe(expected);
    });
  });
});

describe('bytesEqual', () => {
  it('equal bytes', () => {
    const specs = [
      {
        bytes1: new Uint8Array([0, 0, 0, 0, 0, 0]),
        bytes2: new Uint8Array([0, 0, 0, 0, 0, 0]),
        expected: true,
      },
      {
        bytes1: new Uint8Array([0, 0, 0, 0, 0, 0]),
        bytes2: new Uint8Array([0, 0, 0, 0, 0, 1]),
        expected: false,
      },
      {
        bytes1: new Uint8Array([0, 0, 0, 0, 0]),
        bytes2: new Uint8Array([0, 0, 0, 0, 0, 1]),
        expected: false,
      },
    ];

    specs.forEach(({ bytes1, bytes2, expected }) => {
      expect(bytesEqual(bytes1, bytes2)).toBe(expected);
    });
  });
});
