import { Int } from '../../primitives';

export const bytesForInt = (num: number): Uint8Array => new Int(num).toBytes();
