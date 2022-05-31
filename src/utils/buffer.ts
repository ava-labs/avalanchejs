import {toHEX} from 'worktop/buffer';

export function bufferToBigInt(buf: Uint8Array) {
  return BigInt(`0x${toHEX(buf)}`);
}

export function bufferToNumber(buf: Uint8Array) {
  return Number.parseInt(toHEX(buf), 16);
}

export * as buffer from 'worktop/buffer';
