import { bufferToBigInt, bufferToNumber, merge, padLeft } from './buffer';

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

describe('merge', function () {
  it('can merge 2 of same size', () => {
    const arr1 = new Uint8Array([0x01, 0x02]);
    const arr2 = new Uint8Array([0x03, 0x04]);
    const merged = merge([arr1, arr2]);

    expect(new Uint8Array([...arr1, ...arr2])).toStrictEqual(merged);
  });

  it('can merge 2 of different size', () => {
    const arr1 = new Uint8Array([0x01, 0x02]);
    const arr2 = new Uint8Array([0x03, 0x04, 0x05, 0x06]);
    const merged = merge([arr1, arr2]);

    expect(new Uint8Array([...arr1, ...arr2])).toStrictEqual(merged);
  });

  it('can merge 4 of different size', () => {
    const arr1 = new Uint8Array([0x01, 0x02]);
    const arr2 = new Uint8Array([0x03, 0x04, 0x05, 0x06]);
    const arr3 = new Uint8Array([
      0x03, 0x04, 0x05, 0x06, 0x03, 0x04, 0x05, 0x06,
    ]);
    const arr4 = new Uint8Array([0x01, 0x02, 0x01, 0x02]);
    const merged = merge([arr1, arr2, arr3, arr4]);

    expect(new Uint8Array([...arr1, ...arr2, ...arr3, ...arr4])).toStrictEqual(
      merged,
    );
  });
});

describe('padLeft', () => {
  it('pads to 2 bytes', () => {
    const res = padLeft(new Uint8Array([0x72]), 2);
    expect(res).toStrictEqual(new Uint8Array([0x00, 0x72]));
  });

  it('pads to 4 bytes', () => {
    const res = padLeft(new Uint8Array([0x72]), 4);
    expect(res).toStrictEqual(new Uint8Array([0x00, 0x00, 0x00, 0x72]));
  });

  it('pads to 8 bytes', () => {
    const res = padLeft(new Uint8Array([0x72]), 8);
    expect(res).toStrictEqual(
      new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x72]),
    );
  });

  it('pads if empty array', () => {
    const res = padLeft(new Uint8Array([]), 2);
    expect(res).toStrictEqual(new Uint8Array([0x00, 0x00]));
  });

  it('no-ops if already at size', () => {
    const res = padLeft(new Uint8Array([0xaf, 0x72, 0x72]), 2);
    expect(res).toStrictEqual(new Uint8Array([0xaf, 0x72, 0x72]));
  });
});
