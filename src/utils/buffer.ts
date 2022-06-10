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

/**
 * Merges [buffers] into a single Uint8Array.
 * @param buffers Uint8Array[]
 */
export function merge(buffers: Uint8Array[]) {
  const size = buffers.reduce((acc, val) => {
    return acc + val.length;
  }, 0);

  const merged = new Uint8Array(size);

  let offset = 0;
  for (let i = 0; i < buffers.length; i++) {
    merged.set(buffers[i], offset);
    offset += buffers[i].length;
  }

  return merged;
}

export * as buffer from 'worktop/buffer';
