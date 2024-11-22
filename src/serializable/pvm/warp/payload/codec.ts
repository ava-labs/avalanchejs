import { Codec, Manager } from '../../../codec';
import { AddressedCall } from './addressedCall';
import { Hash } from './hash';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/platformvm/warp/payload/codec.go
 */
export const codec = new Codec([Hash, AddressedCall]);

let manager: Manager;
export const getWarpPayloadManager = () => {
  if (manager) return manager;
  manager = new Manager();
  manager.RegisterCodec(0, codec);
  return manager;
};
