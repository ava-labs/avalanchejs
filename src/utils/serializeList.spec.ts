import { TransferableInput } from '../components/avax';
import { transferableInputs, transferableInputsBytes } from '../fixtures/avax';
import { testCodec } from '../fixtures/codec';
import { address, addressesBytes } from '../fixtures/common';
import { Address } from '../fxs/common';
import { convertListStruct, packList, unpackList } from './serializeList';
import { unpack } from './struct';

describe('SerializeList', () => {
  it('unpacks list', () => {
    const adds = addressesBytes();
    expect(unpackList(adds, Address)).toEqual([
      [address(), address()],
      new Uint8Array([]),
    ]);
  });

  it('unpacks list', () => {
    expect(packList([address(), address()])).toEqual(addressesBytes());
  });

  it('unpack for list type', () => {
    const transferableInputsType = convertListStruct(TransferableInput);
    const [result, remaining] = unpack(
      transferableInputsBytes(),
      [transferableInputsType],
      testCodec(),
    );
    expect(result).toEqual(transferableInputs());
    expect(remaining).toHaveLength(0);
  });
});
