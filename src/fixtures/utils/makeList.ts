import { concatBytes } from '@noble/hashes/utils';
import type { Serializable } from 'child_process';
import { bytesForInt } from './bytesFor';

export const makeList =
  <T extends Serializable>(single: () => T) =>
  (): T[] =>
    [single(), single()];

export const makeListBytes = (single: () => Uint8Array) => () =>
  concatBytes(bytesForInt(2), single(), single());
