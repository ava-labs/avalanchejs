import { id, idBytes } from '../../../fixtures/common';
import { describe, it, expect } from 'vitest';

import { testSerialization } from '../../../fixtures/utils/serializable';
import { Id } from './id';

testSerialization('Id', Id, id, idBytes);

describe('id', function () {
  it('works correctly', () => {
    const id = Id.fromHex(
      '0x6176617800000000000000000000000000000000000000000000000000000000',
    );
    const expectedIDStr = 'jvYiYUgxB6hG1dBobJK2JSoyuLtmFiDoXmUVxmAB7juqfbVtu';

    const idStr = id.toString();

    expect(idStr).toEqual(expectedIDStr);

    expect(Id.fromString(expectedIDStr).toBytes()).toEqual(
      new Uint8Array([
        0x61, 0x76, 0x61, 0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
    );
  });
});
