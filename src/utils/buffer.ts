import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils';
import { add0x, strip0x } from 'micro-eth-signer';

export function bufferToBigInt(buf: Uint8Array) {
  return BigInt(bufferToHex(buf));
}

export function bufferToNumber(buf: Uint8Array) {
  return Number.parseInt(bytesToHex(buf), 16);
}

export function bufferToBool(buf: Uint8Array) {
  return bufferToNumber(buf) === 1;
}

export function bufferToHex(buf: Uint8Array) {
  return add0x(bytesToHex(buf));
}

export function hexToBuffer(hex: string) {
  hex = strip0x(hex);
  if (hex.length & 1) {
    hex = '0' + hex;
  }
  return hexToBytes(hex);
}

export function padLeft(bytes: Uint8Array, length: number) {
  const offset = length - bytes.length;

  if (offset <= 0) {
    return bytes;
  }

  const out = new Uint8Array(length);
  out.set(bytes, offset);
  return out;
}

/**
 * Left pads `bytes` to exactly `length`, throwing if it is already too long.
 *
 * Unlike {@link padLeft}, this never returns an oversized result. Serialized
 * fields have a fixed width, so emitting extra bytes would shift every
 * following field in the transaction rather than failing loudly.
 *
 * @param bytes The bytes to pad
 * @param length The exact width of the field, in bytes
 * @param name Field name, used in the error message
 * @returns A Uint8Array of exactly `length` bytes
 */
export function padLeftStrict(
  bytes: Uint8Array,
  length: number,
  name = 'value',
): Uint8Array {
  if (bytes.length > length) {
    throw new Error(
      `${name} is ${bytes.length} bytes, expected at most ${length}`,
    );
  }

  return padLeft(bytes, length);
}

/**
 * Encodes a non-negative integer as exactly `length` big-endian bytes.
 *
 * Throws on negative, fractional, or out-of-range values instead of emitting a
 * field of the wrong width.
 *
 * @param value The value to encode
 * @param length The exact width of the field, in bytes
 * @param name Field name, used in the error message
 * @returns A Uint8Array of exactly `length` bytes
 *
 * @example
 * ```ts
 * toFixedWidthBytes(13, 4); // Uint8Array [0, 0, 0, 13]
 * ```
 */
export function toFixedWidthBytes(
  value: bigint | number,
  length: number,
  name = 'value',
): Uint8Array {
  if (typeof value === 'number' && !Number.isInteger(value)) {
    throw new Error(`${name} must be an integer, got ${value}`);
  }

  const int = BigInt(value);

  if (int < 0n) {
    throw new Error(`${name} must not be negative, got ${value}`);
  }

  const max = (1n << BigInt(length * 8)) - 1n;
  if (int > max) {
    throw new Error(
      `${name} is too large for a ${length} byte field, got ${value}`,
    );
  }

  return padLeft(hexToBuffer(int.toString(16)), length);
}

/**
 * Asserts that `buf` holds at least `length` bytes before they are read.
 *
 * The primitive decoders slice blindly, and a short slice silently decodes to a
 * different value rather than erroring, so every fixed-width read is guarded.
 *
 * @param buf The buffer about to be read from
 * @param length The number of bytes required
 * @param name Field name, used in the error message
 */
export function requireBytes(
  buf: Uint8Array,
  length: number,
  name = 'value',
): void {
  if (buf.length < length) {
    throw new Error(
      `unexpected end of input decoding ${name}: need ${length} bytes, have ${buf.length}`,
    );
  }
}

/**
 * Calculates the number of `1`s (set bits) in the binary
 * representation a big-endian byte slice.
 *
 * @param input A Uint8Array
 * @returns The number of bits set to 1 in the binary representation of the input
 *
 * @example
 * ```ts
 * hammingWeight(new Uint8Array([0, 1, 2, 3, 4, 5])); // 7
 * ```
 */
export const hammingWeight = (input: Uint8Array): number => {
  let count = 0;

  for (let i = 0; i < input.length; i++) {
    let num = input[i];
    while (num !== 0) {
      count += num & 1;
      num >>= 1;
    }
  }

  return count;
};

export { concatBytes, strip0x, add0x };
