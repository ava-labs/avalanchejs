import { TransferableInput } from '.';
import { transferableInput, transferableInputBytes } from '../../fixtures/avax';
import { testCodec } from '../../fixtures/codec';

describe('TransferableInput', () => {
  it('deserializes correctly', () => {
    const [output, remainder] = TransferableInput.fromBytes(
      transferableInputBytes(),
      testCodec,
    );

    expect(output).toStrictEqual(transferableInput());

    expect(remainder).toStrictEqual(new Uint8Array());
  });

  it('serializes correctly', () => {
    expect(transferableInput().toBytes(testCodec)).toStrictEqual(
      transferableInputBytes(),
    );
  });
});
