import {toHEX} from 'worktop/buffer';

export function bufferToNumber(buf: Uint8Array) {
  return BigInt(`0x${toHEX(buf)}`);
}

export * as buffer from 'worktop/buffer';
