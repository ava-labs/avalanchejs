import {
  BigIntPr,
  Bytes,
  Int,
  Short,
  Stringpr,
} from '../serializable/primitives';
import { concatBytes } from '../utils/buffer';
import { bytesForInt } from './utils/bytesFor';

export const intBytes = () => new Uint8Array([0x00, 0x00, 0x00, 0x0d]);

export const int = () => new Int(13);

export const intsBytes = () =>
  concatBytes(bytesForInt(3), intBytes(), intBytes(), intBytes());

export const ints = () => [int(), int(), int()];

export const bytesBytes = () =>
  concatBytes(bytesForInt(2), new Uint8Array([0x01, 0x02]));

export const bytes = () => new Bytes(new Uint8Array([0x01, 0x02]));

export const bigIntPrBytes = () =>
  new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x1e, 0x84, 0x80]);

export const bigIntPr = () => new BigIntPr(2000000n);

export const stringPr = () => new Stringpr('Avax');

export const stringPrBytes = () =>
  new Uint8Array([0x00, 0x04, 0x41, 0x76, 0x61, 0x78]);

export const shortBytes = () => new Uint8Array([0x00, 0x0d]);

export const short = () => new Short(13);
