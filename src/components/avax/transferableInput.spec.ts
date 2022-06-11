import { transferableInput, transferableInputBytes } from '../../fixtures/avax';
import { TransferableInput } from '.';
import { codec0 } from '../../codec/codec';

describe('TransferableInput', () => {
  it('deserializes correctly', () => {
    const [output, remainder] = TransferableInput.fromBytes(
      transferableInputBytes(),
      codec0,
    );

    expect(output).toStrictEqual(transferableInput());

    expect(remainder).toStrictEqual(new Uint8Array());
  });

  it('serializes correctly', () => {
    expect(transferableInput().toBytes(codec0)).toStrictEqual(
      transferableInputBytes(),
    );
  });
});
