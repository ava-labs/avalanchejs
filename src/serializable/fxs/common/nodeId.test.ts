import { testPVMCodec } from '../../../fixtures/codec';
import { nodeId, nodeIdBytes } from '../../../fixtures/common';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { describe, it, expect } from 'vitest';
import { base58check } from '../../../utils/base58';
import { NodeId } from './nodeId';

testSerialization('NodeId', NodeId, nodeId, nodeIdBytes, testPVMCodec);

describe('NodeId.fromString rejects malformed node ids', () => {
  const valid = NodeId.fromHex(
    '0xe9094f73698002fd52c90819b457b9fbc866ab80',
  ).toString();

  it('still parses a genuine NodeID', () => {
    expect(NodeId.fromString(valid).toString()).toEqual(valid);
  });

  it('rejects a prefix with an empty payload', () => {
    // Previously produced the all-zero NodeId, which the network accepts:
    // the stake would be locked until `end` under a node that never runs.
    expect(() => NodeId.fromString('NodeID-')).toThrow();
  });

  it('rejects a single-character typo', () => {
    const body = valid.replace('NodeID-', '');
    const typo = body[2] === 'x' ? 'y' : 'x';
    const corrupted = `NodeID-${body.slice(0, 2)}${typo}${body.slice(3)}`;

    expect(() => NodeId.fromString(corrupted)).toThrow(/checksum mismatch/);
  });

  it('rejects a 32-byte (Id width) payload on the length bound', () => {
    // Anything wider than 20 bytes also encodes to more characters than a
    // NodeID can have, so the O(1) length check rejects it before the decode.
    const wide = base58check.encode(new Uint8Array(32).fill(1));

    expect(() => NodeId.fromString(`NodeID-${wide}`)).toThrow(
      /expected at most/,
    );
  });

  it('rejects a short-but-well-formed payload on the width check', () => {
    // 16 bytes fits inside the character bound, so this exercises the
    // exact-width check rather than the length bound.
    const narrow = base58check.encode(new Uint8Array(16).fill(1));

    expect(() => NodeId.fromString(`NodeID-${narrow}`)).toThrow(/expected 20/);
  });

  it('rejects an oversized string promptly', () => {
    const started = Date.now();
    expect(() => NodeId.fromString(`NodeID-${'z'.repeat(50_000)}`)).toThrow();
    expect(Date.now() - started).toBeLessThan(1_000);
  });
});
