import { TransferableOutput } from '.';
import {
  transferableOutput,
  transferableOutputBytes,
} from '../../fixtures/avax';
import { testCodec } from '../../fixtures/codec';

describe('TransferableOutput', () => {
  it('deserializes correctly', () => {
    const [output, remainder] = TransferableOutput.fromBytes(
      transferableOutputBytes(),
      testCodec,
    );

    expect(output).toStrictEqual(transferableOutput());

    expect(remainder).toStrictEqual(new Uint8Array());
  });

  it('serializes correctly', () => {
    expect(transferableOutput().toBytes(testCodec)).toStrictEqual(
      transferableOutputBytes(),
    );
  });
});
