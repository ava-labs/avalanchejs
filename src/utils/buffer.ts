import * as buffer from 'worktop/buffer';

export function bufferToNumber(buf: Uint8Array) {
  return Number.parseInt(buffer.toHEX(buf), 16);
}

export * as buffer from 'worktop/buffer';
