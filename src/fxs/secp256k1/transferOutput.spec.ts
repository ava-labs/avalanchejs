import { TransferOutput } from '.';
import { transferOutput, transferOutputBytes } from '../../fixtures/secp256k1';

describe('TransferOutput', () => {
  it('deserializes correctly', () => {
    const [output, remainder] = TransferOutput.fromBytes(transferOutputBytes());

    expect(output).toStrictEqual(transferOutput());

    expect(remainder).toStrictEqual(new Uint8Array());
  });

  it('serializes correctly', () => {
    expect(transferOutput().toBytes()).toStrictEqual(transferOutputBytes());
  });
});
