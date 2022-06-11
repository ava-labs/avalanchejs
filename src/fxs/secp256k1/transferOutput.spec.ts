import { TransferOutput } from '.';
import { transferOutput, transferOutputBytes } from '../../fixtures/secp256k1';
import { OutputOwners } from './outputOwners';

describe('TransferOutput', () => {
  /**
   * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-transfer-output-example
   */
  it('deserializes correctly', () => {
    const bytes = transferOutputBytes();

    const [output, remainder] = TransferOutput.fromBytes(bytes);

    expect(output).toStrictEqual(transferOutput());

    expect(remainder).toStrictEqual(new Uint8Array());
  });

  it('can serialize correctly', () => {
    const output = new TransferOutput(
      12345n,
      new OutputOwners(54321n, 1, [
        '0x51025c61fbcfc078f69334f834be6dd26d55a955',
        '0xc3344128e060128ede3523a24a461c8943ab0859',
      ]),
    );

    const bytes = new Uint8Array([
      // amount:
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x39,
      // locktime:
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xd4, 0x31,
      // threshold:
      0x00, 0x00, 0x00, 0x01,
      // number of addresses:
      0x00, 0x00, 0x00, 0x02,
      // addrs[0]:
      0x51, 0x02, 0x5c, 0x61, 0xfb, 0xcf, 0xc0, 0x78, 0xf6, 0x93, 0x34, 0xf8,
      0x34, 0xbe, 0x6d, 0xd2, 0x6d, 0x55, 0xa9, 0x55,
      // addrs[1]:
      0xc3, 0x34, 0x41, 0x28, 0xe0, 0x60, 0x12, 0x8e, 0xde, 0x35, 0x23, 0xa2,
      0x4a, 0x46, 0x1c, 0x89, 0x43, 0xab, 0x08, 0x59,
    ]);

    expect(output.toBytes()).toStrictEqual(bytes);
  });
});
