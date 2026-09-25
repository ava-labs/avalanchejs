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
