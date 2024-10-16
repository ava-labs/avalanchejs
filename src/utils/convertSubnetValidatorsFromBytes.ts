import { ConvertSubnetValidator } from '../serializable/fxs/pvm/convertSubnetValidator';

export function convertSubnetValidatorFromBytes(
  bytes: readonly Uint8Array[],
): ConvertSubnetValidator[] {
  return bytes.map((b) => ConvertSubnetValidator.fromBytes(b)[0]);
}
