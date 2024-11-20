import { Codec, Manager } from '../../codec';
import { WarpSignature } from './signature';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/platformvm/warp/codec.go
 */
export const codec = new Codec([WarpSignature]);

let manager: Manager;
export const getWarpManager = () => {
  if (manager) return manager;
  manager = new Manager();
  manager.RegisterCodec(0, codec);
  return manager;
};
