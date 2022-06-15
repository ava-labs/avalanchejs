import { Bytes } from '../primatives/bytes';
import { Int } from '../primatives/int';
import { merge } from '../utils/buffer';

export const intBytes = () => new Uint8Array([0x00, 0x00, 0x00, 0x0d]);

export const int = () => new Int(13);

export const bytesBytes = () =>
  merge([new Int(2).toBytes(), new Uint8Array([0x01, 0x02])]);

export const bytes = () => new Bytes(new Uint8Array([0x01, 0x02]));
