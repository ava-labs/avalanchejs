import {
  SecpTransferOutput,
  secpTransferOutputFromBytes,
} from './secpTransferOutput';

describe('SecpTransferOutput', () => {
  it('deserializes correctly', () => {
    const input = new Uint8Array([
      // typeID:
      0x00, 0x00, 0x00, 0x07,
      // amount:
      0x00, 0x00, 0x00, 0x00, 0x00, 0x0f, 0x42, 0x40,
      // locktime:
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      // threshold:
      0x00, 0x00, 0x00, 0x01,
      // number of addresses:
      0x00, 0x00, 0x00, 0x01,
      // addrs[0]:
      0x66, 0xf9, 0x0d, 0xb6, 0x13, 0x7a, 0x78, 0xf7, 0x6b, 0x36, 0x93, 0xf7,
      0xf2, 0xbc, 0x50, 0x79, 0x56, 0xda, 0xe5, 0x63,
    ]);

    const output = secpTransferOutputFromBytes(input);

    const expectedOutput: SecpTransferOutput = {
      typeID: 7,
      amount: 1000000n,
      locktime: 0n,
      threashold: 1,
      addresses: ['0x66f90db6137a78f76b3693f7f2bc507956dae563'],
    };

    expect(output).toEqual(expectedOutput);
  });
});
