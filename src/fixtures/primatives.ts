import { BigIntPr } from '../primatives/bigintpr';
import { Bytes } from '../primatives/bytes';
import { Int } from '../primatives/int';
import { Ints } from '../primatives/ints';
import { concatBytes } from '../utils/buffer';
import { bytesForInt } from './utils/bytesFor';

export const intBytes = () => new Uint8Array([0x00, 0x00, 0x00, 0x0d]);

export const int = () => new Int(13);

export const intsBytes = () =>
  concatBytes(bytesForInt(3), intBytes(), intBytes(), intBytes());

export const ints = () => new Ints([int(), int(), int()]);

export const bytesBytes = () =>
  concatBytes(new Int(2).toBytes(), new Uint8Array([0x01, 0x02]));

export const bytes = () => new Bytes(new Uint8Array([0x01, 0x02]));

export const bigIntPrBytes = () =>
  new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x1e, 0x84, 0x80]);

export const bigIntPr = () => new BigIntPr(2000000n);
