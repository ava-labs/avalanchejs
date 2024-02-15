import { Int } from '../../serializable/primitives/int';

export const bytesForInt = (num: number): Uint8Array => new Int(num).toBytes();
