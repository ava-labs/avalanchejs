// Inspired by https://github.com/lyngklip/structjs/blob/master/struct.mjs
// TODO: Cleanup

import {
  bufferToBigInt,
  bufferToHex,
  bufferToNumber,
  hexToBuffer,
  merge,
  padLeft,
} from './buffer';
import { UnpackReturn } from './models';

type ValueConfigTuple = [UnpackReturn, Configs];

export type Configs = {
  lengthConfig?: Configs;
  unpack?: (buff: Uint8Array) => UnpackReturn;
  unpackItem?: (buff: Uint8Array) => [UnpackReturn, Uint8Array];
  unpackChunk?: (
    buff: Uint8Array,
    length: number,
  ) => [UnpackReturn, Uint8Array];
  unpackCustom?: (buff: Uint8Array) => [UnpackReturn, Uint8Array];
  offset?: number;
  pack(value: UnpackReturn): Uint8Array;
};

const address: Configs = {
  offset: 20,
  unpack: bufferToHex,
  pack: (value: string) => {
    return padLeft(hexToBuffer(value), 20);
  },
};

const id: Configs = {
  offset: 32,
  unpack: bufferToHex,
  pack: (value: string) => {
    return padLeft(hexToBuffer(value), 32);
  },
};

const int: Configs = {
  offset: 4,
  unpack: bufferToNumber,
  pack: (value: number) => {
    return padLeft(hexToBuffer(value.toString(16)), 4);
  },
};

const bigInt: Configs = {
  offset: 8,
  unpack: bufferToBigInt,
  pack: (value: bigint) => {
    return padLeft(hexToBuffer(value.toString(16)), 8);
  },
};

const codec: Configs = {
  offset: 2,
  unpack: bufferToNumber,
  pack: (value: number) => {
    return padLeft(hexToBuffer(value.toString(16)), 2);
  },
};

const addressList: Configs = {
  lengthConfig: int,
  unpackItem: (buff: Uint8Array) => unpack<[string]>(buff, [address]),
  pack: (addresses: string[]) => {
    const addrsSize = padLeft(hexToBuffer(addresses.length.toString(16)), 4);
    const addrs = addresses.map(hexToBuffer);
    return merge([addrsSize, merge(addrs)]);
  },
};

const byteList: Configs = {
  lengthConfig: int,
  unpackChunk: (buff: Uint8Array, length: number) => [
    buff.slice(0, length),
    buff.slice(length),
  ],
  pack: (array: Uint8Array) => {
    return array;
  },
};

export const configs: Record<string, Configs> = {
  address,
  id,
  int,
  bigInt,
  codec,
  addressList,
  byteList,
};

export const unpack = <O extends UnpackReturn[]>(
  buffer: Uint8Array,
  configs: Configs[],
): [...O, Uint8Array] => {
  const result = configs.map((config): UnpackReturn => {
    if (config.unpackCustom) {
      let res;
      [res, buffer] = config.unpackCustom(buffer);
      return res;
    }

    if (!config.lengthConfig) {
      if (!buffer.length) throw new Error('not enough bytes');
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
    [length, buffer] = unpack<[number]>(buffer, [config.lengthConfig]);
    if (config.unpackChunk) {
      let res;
      [res, buffer] = config.unpackChunk(buffer, length);
      return res;
    }
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

/**
 * Pack the given values into a single buffer.
 * @param values An array of values to pack.
 */
export function pack(values: ValueConfigTuple[]) {
  const buffs = values.map((val) => {
    return val[1].pack(val[0]);
  });
  return merge(buffs);
}
