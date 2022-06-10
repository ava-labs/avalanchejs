import { OutputOwners } from '.';

describe('OutputOwners', () => {
  /**
   * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-output-owners-output
   */
  it('deserializes correctly', () => {
    const bytes = new Uint8Array([
      // locktime:
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      // threshold:
      0x00, 0x00, 0x00, 0x01,
      // number of addresses:
      0x00, 0x00, 0x00, 0x01,
      // addrs[0]:
      0xda, 0x2b, 0xee, 0x01, 0xbe, 0x82, 0xec, 0xc0, 0x0c, 0x34, 0xf3, 0x61,
      0xed, 0xa8, 0xeb, 0x30, 0xfb, 0x5a, 0x71, 0x5c,
    ]);

    const [output, remainder] = OutputOwners.fromBytes(bytes);

    expect(output).toStrictEqual(
      new OutputOwners(0n, 1, ['0xda2bee01be82ecc00c34f361eda8eb30fb5a715c']),
    );

    expect(remainder).toStrictEqual(new Uint8Array());
  });
});
