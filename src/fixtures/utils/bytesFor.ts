import { Int } from '../../primatives/int';

export const bytesForInt = (num: number): Uint8Array =>
  new Int(num).toBytesNoCodec();
