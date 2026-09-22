import { id, idBytes } from '../../../fixtures/common';
import { describe, it, expect } from 'vitest';

import { testSerialization } from '../../../fixtures/utils/serializable';
import { Id } from './id';
import { base58check } from '../../../utils/base58';

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

describe('Id.fromString rejects malformed identifiers', () => {
  const valid = Id.fromHex(
    '0x6176617800000000000000000000000000000000000000000000000000000000',
  ).toString();

  it('rejects the empty string instead of yielding the zero id', () => {
    // '' used to decode to an empty payload that was zero-extended to 32
    // bytes, i.e. PrimaryNetworkID / PlatformChainID. A placeholder silently
    // became a real, meaningful identifier.
    expect(() => Id.fromString('')).toThrow();
    expect(() => Id.fromString('1')).toThrow();
  });

  it('rejects a truncated identifier', () => {
    expect(() => Id.fromString(valid.slice(0, 10))).toThrow();
  });

  it('rejects a single-character typo', () => {
    const typo = valid[3] === 'x' ? 'y' : 'x';
    const corrupted = valid.slice(0, 3) + typo + valid.slice(4);

    expect(() => Id.fromString(corrupted)).toThrow(/checksum mismatch/);
  });

  it('rejects a 20-byte (NodeId width) payload', () => {
    const shortPayload = base58check.encode(new Uint8Array(20).fill(1));

    expect(() => Id.fromString(shortPayload)).toThrow(/expected 32/);
  });

  it('rejects an oversized string promptly', () => {
    const started = Date.now();
    expect(() => Id.fromString('z'.repeat(50_000))).toThrow();
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  it('toBytes equals the decoded payload byte for byte', () => {
    const payload = new Uint8Array(32).fill(0xab);

    expect(Id.fromString(base58check.encode(payload)).toBytes()).toEqual(
      payload,
    );
  });
});
