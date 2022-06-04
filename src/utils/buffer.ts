import {toHEX} from 'worktop/buffer';

export function bufferToBigInt(buf: Uint8Array) {
  return BigInt(`0x${toHEX(buf)}`);
}

export function bufferToNumber(buf: Uint8Array) {
  return Number.parseInt(toHEX(buf), 16);
}

export function merge(buf1: Uint8Array, buf2: Uint8Array) {
  const merged = new Uint8Array(buf1.length + buf2.length);
  merged.set(buf1);
  merged.set(buf2, buf1.length);
  return merged;
}

export * as buffer from 'worktop/buffer';
