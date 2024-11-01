import { TransferableInput } from '../serializable/avax';
import { describe, it, expect } from 'vitest';

import { transferableInputs, transferableInputsBytes } from '../fixtures/avax';
import { testCodec } from '../fixtures/codec';
import { address, addressesBytes } from '../fixtures/common';
import { Address } from '../serializable/fxs/common';
import { packList, toListStruct, unpackList } from './serializeList';
import { unpack } from './struct';

describe('SerializeList', () => {
  it('unpacks list', () => {
    const adds = addressesBytes();
    expect(unpackList(adds, Address, testCodec())).toEqual([
      [address(), address()],
      new Uint8Array([]),
    ]);
  });

  it('unpacks list', () => {
    expect(packList([address(), address()], testCodec())).toEqual(
      addressesBytes(),
    );
  });

  it('unpack for list type', () => {
    const transferableInputsType = toListStruct(TransferableInput);
    const [result, remaining] = unpack(
      transferableInputsBytes(),
      [transferableInputsType],
      testCodec(),
    );
    expect(result).toEqual(transferableInputs());
    expect(remaining).toHaveLength(0);
  });
});
