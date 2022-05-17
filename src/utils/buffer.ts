import {toHEX} from 'worktop/buffer';

export function bufferToNumber(buf: Uint8Array) {
  return Number.parseInt(toHEX(buf), 16);
}

export * as buffer from 'worktop/buffer';
