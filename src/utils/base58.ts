import { base58 } from '@scure/base';
import type { BytesCoder } from '@scure/base';
import { sha256 } from '@noble/hashes/sha256';
import { concatBytes } from './buffer';

/** Width of the CB58 checksum suffix: the last 4 bytes of sha256(payload). */
const CHECKSUM_LEN = 4;

/** log(256)/log(58): the base58 characters needed per byte, at most. */
const CHARS_PER_BYTE = Math.log(256) / Math.log(58);

/**
 * The longest base58 string that can encode `byteLength` bytes.
 *
 * Leading zero bytes encode to one character each, which is never more than
 * the ~1.366 characters a non-zero byte needs, so this is a true upper bound.
 */
export const maxBase58Length = (byteLength: number): number =>
  Math.ceil(byteLength * CHARS_PER_BYTE);

const equalBytes = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

/**
 * Decodes a CB58 string: base58(payload || sha256(payload)[-4:]).
 *
 * Two properties this holds that a bare `base58.decode(str).subarray(0, -4)`
 * gives up:
 *
 * 1. The checksum is verified. It exists so that a mistyped, truncated or
 *    corrupted identifier is rejected rather than silently decoding to a
 *    different valid-looking value that is then embedded in a transaction the
 *    user signs.
 * 2. The input length is bounded before decoding. base58 is a non power of two
 *    radix, so decoding is a repeated long division over the whole digit array
 *    and costs O(n^2) in the length of the string. Identifier strings reach
 *    this function from untrusted sources (an RPC node's JSON, a dApp, a
 *    paste), so without a bound the caller of the string chooses how long the
 *    single JS thread blocks. The bound is checked first because it is O(1)
 *    and the decode is not.
 *
 * @param str The CB58 string to decode
 * @param expectedPayloadLength The exact payload width, when the caller knows
 * it. Every Avalanche identifier does. Bounds the work before decoding and
 * rejects a payload of the wrong width afterwards.
 * @returns The verified payload, without the checksum
 */
export function decodeBase58Check(
  str: string,
  expectedPayloadLength?: number,
): Uint8Array {
  if (expectedPayloadLength !== undefined) {
    const maxLength = maxBase58Length(expectedPayloadLength + CHECKSUM_LEN);

    if (str.length > maxLength) {
      throw new Error(
        `invalid base58check string: ${str.length} characters, expected at most ${maxLength}`,
      );
    }
  }

  const decoded = base58.decode(str);

  if (decoded.length < CHECKSUM_LEN) {
    throw new Error(
      `invalid base58check string: decodes to ${decoded.length} bytes, need at least ${CHECKSUM_LEN} for a checksum`,
    );
  }

  const payload = decoded.subarray(0, -CHECKSUM_LEN);

  if (
    expectedPayloadLength !== undefined &&
    payload.length !== expectedPayloadLength
  ) {
    throw new Error(
      `invalid base58check payload: ${payload.length} bytes, expected ${expectedPayloadLength}`,
    );
  }

  const expectedChecksum = sha256(payload).subarray(-CHECKSUM_LEN);

  if (!equalBytes(decoded.subarray(-CHECKSUM_LEN), expectedChecksum)) {
    throw new Error('invalid base58check string: checksum mismatch');
  }

  return payload;
}

export const base58check: BytesCoder = {
  encode(data) {
    return base58.encode(
      concatBytes(data, sha256(data).subarray(-CHECKSUM_LEN)),
    );
  },
  decode(string) {
    return decodeBase58Check(string);
  },
};

export { base58 } from '@scure/base';
