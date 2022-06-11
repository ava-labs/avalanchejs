import { Input } from '.';
import { input, inputBytes } from '../../fixtures/secp256k1';

describe('Input', () => {
  it('deserializes correctly', () => {
    const [output, remainder] = Input.fromBytes(inputBytes());

    expect(output).toStrictEqual(input());

    expect(remainder).toStrictEqual(new Uint8Array());
  });

  it('serializes correctly', () => {
    expect(input().toBytes()).toStrictEqual(inputBytes());
  });
});
