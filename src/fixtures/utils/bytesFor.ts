import { Int } from '../../serializable/primitives';

export const bytesForInt = (num: number): Uint8Array => new Int(num).toBytes();
