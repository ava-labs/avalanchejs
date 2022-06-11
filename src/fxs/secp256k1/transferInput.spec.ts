import { Input, TransferInput } from '.';

describe('TransferInput', () => {
  /**
   * @see https://docs.avax.network/specs/avm-transaction-serialization#secp256k1-transfer-input-example
   */
  it('deserializes correctly', () => {
    const bytes = new Uint8Array([
      // amount:
      0x00, 0x00, 0x00, 0x00, 0x07, 0x5b, 0xcd, 0x15,
      // length:
      0x00, 0x00, 0x00, 0x02,
      // sig[0]
      0x00, 0x00, 0x00, 0x03,
      // sig[1]
      0x00, 0x00, 0x00, 0x07,
    ]);

    const [output, remainder] = TransferInput.fromBytes(bytes);

    expect(output).toStrictEqual(
      new TransferInput(123456789n, new Input([3, 7])),
    );

    expect(remainder).toStrictEqual(new Uint8Array());
  });
});
