import { concatBytes } from '../../utils/buffer';
import type { Serializable } from '../../serializable/common/types';
import { bytesForInt } from './bytesFor';

export const makeList =
  <T extends Serializable>(single: () => T) =>
  (): T[] =>
    [single(), single()];

export const makeListBytes = (single: () => Uint8Array) => () =>
  concatBytes(bytesForInt(2), single(), single());
