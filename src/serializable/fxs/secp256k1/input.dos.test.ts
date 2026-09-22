import { describe, expect, it } from 'vitest';

import { Input } from './input';
import { OutputOwners } from './outputOwners';
import { getAVMManager } from '../../avm/codec';

/**
 * Deserialising an n-byte message must be O(n), regardless of how many fields
 * or list elements it declares.
 *
 * Every primitive `fromBytes` used to hand back the unread remainder as a
 * copying `Uint8Array.prototype.slice`, so consuming one 4-byte field copied
 * every byte still unread. A message chooses its own field count, and a list
 * of 4-byte Int sig indices maximises it: an n-byte input copies ~n^2/8 bytes.
 * The bytes need not form a transaction the network would accept — the cost is
 * paid at parse time, before anything is validated or shown to the user.
 *
 * Untrusted bytes reach this path from an RPC node (`getUTXOs`, `getTx`) and
 * from a dApp handing a wallet a transaction (`UnsignedTx.fromJSON`).
 */

/** A secp256k1fx Input: a 4-byte count followed by that many 4-byte Ints. */
const sigIndexListBytes = (count: number): Uint8Array => {
  const buf = new Uint8Array(4 + count * 4);
  new DataView(buf.buffer).setUint32(0, count, false);
  for (let i = 0; i < count; i++) {
    new DataView(buf.buffer).setUint32(4 + i * 4, i, false);
  }
  return buf;
};

describe('linear-time deserialisation', () => {
  // Measured on this tree: with a copying remainder these take 959ms (256 KiB)
  // and 12,994ms (1 MiB); with a view they take 21ms and 69ms. The 2s bound
  // sits ~29x above the linear cost and ~6x below the quadratic one.
  it('parses a 1 MiB sig-index list in bounded time', () => {
    const count = 262_144;
    const bytes = sigIndexListBytes(count);

    const started = Date.now();
    const [input, remaining] = Input.fromBytes(bytes);
    const elapsed = Date.now() - started;

    expect(input.values()).toHaveLength(count);
    expect(remaining).toHaveLength(0);
    expect(elapsed).toBeLessThan(2_000);
  });

  it('scales linearly, not quadratically, with input size', () => {
    const time = (count: number) => {
      const bytes = sigIndexListBytes(count);
      const started = performance.now();
      Input.fromBytes(bytes);
      return performance.now() - started;
    };

    time(16_384); // warm up

    const small = time(65_536);
    const large = time(262_144); // 4x the elements

    // Linear predicts ~4x (measured 3.3x), quadratic ~16x (measured 13.5x).
    // 8x separates them with room for jitter in both directions.
    expect(large).toBeLessThan(Math.max(small, 1) * 8);
  });

  it('parses a UTXO whose output owners carry a huge address list', () => {
    // 20-byte Address elements, reached through any Codec-typed member such as
    // Utxo.output. Quadratic cost here is ~n^2/40.
    const count = 100_000;
    const addrs = new Uint8Array(4 + count * 20);
    new DataView(addrs.buffer).setUint32(0, count, false);

    const owners = new Uint8Array(8 + 4 + addrs.length);
    // locktime (8 bytes) + threshold (4 bytes) + address list
    new DataView(owners.buffer).setUint32(8, 1, false);
    owners.set(addrs, 12);

    const started = Date.now();
    const [parsed] = OutputOwners.fromBytes(
      owners,
      getAVMManager().getDefaultCodec(),
    );

    expect(parsed.addrs).toHaveLength(count);
    expect(Date.now() - started).toBeLessThan(2_000);
  });
});

// These two guard the length-prefix bounds check added in `requireBytes`
// (commit "fix: buffer length checks"). Kept here so the codec-DoS branch
// cannot regress it: without it, a field that declares more bytes than it
// carries silently truncates instead of failing.
describe('length-prefixed fields are bounded by the buffer', () => {
  it('rejects a Bytes field that declares more than remains', async () => {
    const { Bytes } = await import('../../primitives/bytes');
    // Declares 1000 bytes of payload but supplies 2.
    const buf = new Uint8Array([0, 0, 0x03, 0xe8, 0xaa, 0xbb]);

    expect(() => Bytes.fromBytes(buf)).toThrow(/unexpected end of input/);
  });

  it('rejects a Stringpr field that declares more than remains', async () => {
    const { Stringpr } = await import('../../primitives/stringpr');
    const buf = new Uint8Array([0x03, 0xe8, 0xaa, 0xbb]);

    expect(() => Stringpr.fromBytes(buf)).toThrow(/unexpected end of input/);
  });
});
