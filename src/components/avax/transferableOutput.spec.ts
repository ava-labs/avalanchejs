import {
  transferableOutput,
  transferableOutputBytes,
} from '../../fixtures/avax';
import { TransferableOutput } from '.';
import { codec0 } from '../../codec/codec';

describe('TransferableOutput', () => {
  it('deserializes correctly', () => {
    const [output, remainder] = TransferableOutput.fromBytes(
      transferableOutputBytes(),
      codec0,
    );

    expect(output).toStrictEqual(transferableOutput());

    expect(remainder).toStrictEqual(new Uint8Array());
  });

  it('serializes correctly', () => {
    expect(transferableOutput().toBytes(codec0)).toStrictEqual(
      transferableOutputBytes(),
    );
  });
});
