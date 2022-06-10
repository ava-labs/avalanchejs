// Inspired by https://github.com/lyngklip/structjs/blob/master/struct.mjs
// TODO: Cleanup

import { bufferToBigInt, bufferToHex, bufferToNumber } from './buffer';
import { UnpackReturn } from './models';

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
  unpackChunk: (buff: Uint8Array, length: number) => [
    buff.slice(0, length),
    buff.slice(length),
  ],
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

export const unpackv2 = <O extends UnpackReturn[]>(
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
