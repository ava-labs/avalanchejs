import { ConvertSubnetValidator } from '../serializable/fxs/pvm/convertSubnetValidator';
import { getManagerForVM } from './packTx';

export function convertSubnetValidatorFromBytes(
  bytes: readonly Uint8Array[],
): ConvertSubnetValidator[] {
  const codecs = getManagerForVM('PVM').getDefaultCodec();
  return bytes.map((b) => ConvertSubnetValidator.fromBytes(b, codecs)[0]);
}
