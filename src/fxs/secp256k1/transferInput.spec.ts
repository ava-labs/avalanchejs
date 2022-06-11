import { TransferInput } from '.';
import { transferInput, transferInputBytes } from '../../fixtures/secp256k1';

describe('TransferInput', () => {
  it('deserializes correctly', () => {
    const [output, remainder] = TransferInput.fromBytes(transferInputBytes());

    expect(output).toStrictEqual(transferInput());

    expect(remainder).toStrictEqual(new Uint8Array());
  });

  it('serializes correctly', () => {
    expect(transferInput().toBytes()).toStrictEqual(transferInputBytes());
  });
});
