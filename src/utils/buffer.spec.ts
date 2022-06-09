import { bufferToBigInt, bufferToNumber } from './buffer';

describe('bufferToBigInt', () => {
  it('converts Uint8Arrays correctly', async () => {
    const tests = [
      {
        buffer: new Uint8Array([0x00, 0x00]),
        number: 0n,
      },
      {
        buffer: new Uint8Array([0x00, 0x00, 0x00, 0x07]),
        number: 7n,
      },
      {
        buffer: new Uint8Array([
          0x00, 0x00, 0x00, 0x00, 0x77, 0x35, 0x94, 0x00,
        ]),
        number: 2_000_000_000n,
      },
    ];

    for (const { buffer, number } of tests) {
      expect(bufferToBigInt(buffer)).toEqual(number);
    }
  });
});

describe('bufferToNumber', () => {
  it('converts Uint8Arrays correctly', async () => {
    const tests = [
      {
        buffer: new Uint8Array([0x00, 0x00]),
        number: 0,
      },
      {
        buffer: new Uint8Array([0x00, 0x00, 0x00, 0x07]),
        number: 7,
      },
      {
        buffer: new Uint8Array([
          0x00, 0x00, 0x00, 0x00, 0x77, 0x35, 0x94, 0x00,
        ]),
        number: 2_000_000_000,
      },
    ];

    for (const { buffer, number } of tests) {
      expect(bufferToNumber(buffer)).toEqual(number);
    }
  });
});
