import { Codec, Manager } from '../../../codec';
import { L1ValidatorWeight } from './l1ValidatorWeight';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/platformvm/warp/message/codec.go#L4
 */
export const codec = new Codec([
  ...Array(3).fill(undefined),
  L1ValidatorWeight,
]);

let manager: Manager;
export const getWarpMessageManager = () => {
  if (manager) return manager;
  manager = new Manager();
  manager.RegisterCodec(0, codec);
  return manager;
};
