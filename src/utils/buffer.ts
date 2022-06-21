import { asHEX, toHEX } from 'worktop/buffer';
import { strip0x } from './strip0x';
import { prepend0x } from './prepend0x';

export function bufferToBigInt(buf: Uint8Array) {
  return BigInt(bufferToHex(buf));
}

export function bufferToNumber(buf: Uint8Array) {
  return Number.parseInt(toHEX(buf), 16);
}

export function bufferToHex(buf: Uint8Array) {
  return prepend0x(toHEX(buf));
}

export function hexToBuffer(hex: string) {
  hex = strip0x(hex);
  if (hex.length & 1) {
    hex = '0' + hex;
  }
  return asHEX(hex);
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

export { concatBytes } from '@noble/hashes/utils';

export * as buffer from 'worktop/buffer';
