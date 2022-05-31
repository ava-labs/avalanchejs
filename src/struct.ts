// Inspired by https://github.com/lyngklip/structjs/blob/master/struct.mjs
// TODO: Cleanup

import {bufferToBigInt, bufferToNumber} from './utils/buffer';

const typeMapping = {
  i: {
    // 32 byte-array (id)
    unpack(buf: Uint8Array) {
      return [buf.slice(0, 32), buf.slice(32)];
    },
  },
  n: {
    // Int
    unpack(buf: Uint8Array) {
      return [bufferToNumber(buf.slice(0, 4)), buf.slice(4)];
    },
  },
  b: {
    // Big int
    unpack(buf: Uint8Array) {
      return [bufferToBigInt(buf.slice(0, 4)), buf.slice(4)];
    },
  },
  u: {
    // Uint64
    unpack(buf: Uint8Array) {
      return [bufferToBigInt(buf.slice(0, 8)), buf.slice(8)];
    },
  },
  r: {
    // Array
    unpack(buf: Uint8Array, length: number, type: 'i' | 'n' | 'b' | 'u' | 'a') {
      const array = [];
      for (let i = 0; i < length; i++) {
        const [temporary, ibuf] = typeMapping[type].unpack(buf);
        array.push(temporary);
        buf = ibuf as Uint8Array; // TODO: type
      }

      return [array, buf];
    },
  },
  a: {
    // Addresss
    unpack(buf: Uint8Array) {
      return [buf.slice(0, 20), buf.slice(20)];
    },
  },
};

export function unpack(format: string, buf: Uint8Array) {
  const array = [];
  for (let i = 0; i < format.length; i++) {
    switch (format[i]) {
      case 'i':
      case 'n':
      case 'b':
      case 'u':
      case 'a':
        const [temporary1, ibuf1] = typeMapping[format[i]].unpack(buf);
        array.push(temporary1);
        buf = ibuf1;
        continue;
      case 'r':
        const [length, ibuf2] = typeMapping.n.unpack(buf);
        const [temporary2, ibuf3] = typeMapping.r.unpack(
          ibuf2 as Uint8Array, // TODO: type
          length as number, // TODO: type
          typeMapping[format[(i += 1)]],
        );
        array.push(temporary2);
        buf = ibuf3 as Uint8Array; // TODO: type
        continue;
      default:
        throw new Error(`Unsupported format char: ${format[i]}`);
    }
  }

  if (buf.length > 0) {
    array.push(buf);
  }

  return array;
}
