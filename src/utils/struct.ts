// Inspired by https://github.com/lyngklip/structjs/blob/master/struct.mjs
// TODO: Cleanup

import { toUTF8 } from 'worktop/buffer';
import { bufferToBigInt, bufferToHex, bufferToNumber } from './buffer';

type UnpackReturn = Uint8Array | number | bigint | string | string[];

export type Configs = {
  lengthConfig?: Configs;
  unpack?: (buff: Uint8Array) => UnpackReturn;
  unpackItem?: (buff: Uint8Array) => [UnpackReturn, Uint8Array];
  offset?: number;
};

const address: Configs = {
  offset: 20,
  unpack: bufferToHex,
};

const id: Configs = {
  offset: 32,
  unpack: bufferToHex,
};

const int: Configs = {
  offset: 4,
  unpack: bufferToNumber,
};

const bigInt: Configs = {
  offset: 8,
  unpack: bufferToBigInt,
};

const codec: Configs = {
  offset: 2,
  unpack: bufferToNumber,
};

const addressList: Configs = {
  lengthConfig: int,
  unpackItem: (buff: Uint8Array) => unpackv2<[string]>(buff, [address]),
};

const byteList: Configs = {
  lengthConfig: int,
  unpackItem: (buff: Uint8Array) => [buff.slice(0, 1), buff.slice(1)],
};

export const configs: Record<string, Configs> = {
  address,
  id,
  int,
  bigInt,
  codec,
  addressList,
};

export const unpackv2 = <O extends UnpackReturn[]>(
  buffer: Uint8Array,
  configs: Configs[],
): [...O, Uint8Array] => {
  const result = configs.map((config): UnpackReturn => {
    if (!config.lengthConfig) {
      const offset = config.offset;
      const unpacker = config.unpack;
      if (!unpacker) {
        throw new Error(
          'config must have either lengthConfig or unpack method',
        );
      }
      const unpackerInput = buffer.slice(0, offset);
      buffer = buffer.slice(offset);
      return unpacker(unpackerInput);
    }
    let length: number;
    //length is always int https://docs.avax.network/specs/serialization-primitives/#variable-length-array
    [length, buffer] = unpackv2<[number]>(buffer, [config.lengthConfig]);

    // TODO(hiimoliverwng): if there's a way to not any this, fix it
    const listResult: any[] = [];
    for (let j = 0; j < length; j++) {
      let res;
      const unpackItem = config.unpackItem;
      if (!unpackItem) {
        throw new Error('unpackConfig not found for list type');
      }
      [res, buffer] = unpackItem(buffer);
      listResult.push(res);
    }
    return listResult;
  });
  if (!result.length) {
    throw new Error('incorrect result length');
  }
  result.push(buffer);
  // not sure how to make these types
  return result as [...O, Uint8Array];
};

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
  c: {
    // Codec
    unpack(buf: Uint8Array) {
      return [bufferToNumber(buf.slice(0, 2)), buf.slice(2)];
    },
  },
  a: {
    // Addresss
    unpack(buf: Uint8Array) {
      return [toUTF8(buf.slice(0, 20)), buf.slice(20)];
    },
  },
};

const unpackArray = (
  buf: Uint8Array,
  length: number,
  type: keyof typeof typeMapping,
): [UnpackReturn[], Uint8Array] => {
  const array: UnpackReturn[] = [];
  for (let i = 0; i < length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const [temporary, ibuf] = typeMapping[type].unpack(buf);
    array.push(temporary as any);
    buf = ibuf as Uint8Array; // TODO: type
  }

  return [array, buf];
};

export function unpack(format: string, buf: Uint8Array): any {
  const array: UnpackReturn[] = [];
  for (let i = 0; i < format.length; i++) {
    switch (format[i]) {
      case 'i':
      case 'n':
      case 'b':
      case 'u':
      case 'a':
      case 'c':
        // eslint-disable-next-line no-case-declarations, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const [temporary1, ibuf1] = typeMapping[format[i]].unpack(buf);
        array.push(temporary1);
        buf = ibuf1; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        continue;
      case 'r':
        // TODO: cleanup
        const [length, ibuf2] = typeMapping.n.unpack(buf); // eslint-disable-line no-case-declarations
        // eslint-disable-next-line no-case-declarations
        const [temporary2, ibuf3] = unpackArray(
          ibuf2 as Uint8Array, // TODO: type
          length as number, // TODO: type
          format[(i += 1)] as any,
        );
        array.push(...temporary2);
        buf = ibuf3 as Uint8Array; // TODO: type
        continue;
      default:
        throw new Error(`Unsupported format char: ${format[i]}`);
    }
  }

  if (buf.length > 0) {
    array.push(buf);
  }

  return array; // eslint-disable-line @typescript-eslint/no-unsafe-return
}
