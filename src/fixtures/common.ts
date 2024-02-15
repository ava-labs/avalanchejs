import { Address } from '../serializable/fxs/common/address';
import { Id } from '../serializable/fxs/common/id';
import { NodeId } from '../serializable/fxs/common/nodeId';
import { bytesForInt } from './utils/bytesFor';
import { makeList } from './utils/makeList';

const TEST_ADDRESS_HEX = '8db97c7cece249c2b98bdc0226cc4c2a57bf52fc';
const TEST_ID_HEX =
  'dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db';
const TEST_NODE_ID_HEX = '0xe9094f73698002fd52c90819b457b9fbc866ab80';

export const addressBytes = () =>
  new Uint8Array([
    0x8d, 0xb9, 0x7c, 0x7c, 0xec, 0xe2, 0x49, 0xc2, 0xb9, 0x8b, 0xdc, 0x02,
    0x26, 0xcc, 0x4c, 0x2a, 0x57, 0xbf, 0x52, 0xfc,
  ]);

export const address = () => Address.fromHex(TEST_ADDRESS_HEX);

export const idBytes = () =>
  new Uint8Array([
    0xdb, 0xcf, 0x89, 0x0f, 0x77, 0xf4, 0x9b, 0x96, 0x85, 0x76, 0x48, 0xb7,
    0x2b, 0x77, 0xf9, 0xf8, 0x29, 0x37, 0xf2, 0x8a, 0x68, 0x70, 0x4a, 0xf0,
    0x5d, 0xa0, 0xdc, 0x12, 0xba, 0x53, 0xf2, 0xdb,
  ]);

export const id = () => Id.fromHex(TEST_ID_HEX);

export const nodeIdBytes = () =>
  new Uint8Array([
    0xe9, 0x09, 0x4f, 0x73, 0x69, 0x80, 0x02, 0xfd, 0x52, 0xc9, 0x08, 0x19,
    0xb4, 0x57, 0xb9, 0xfb, 0xc8, 0x66, 0xab, 0x80,
  ]);

export const nodeId = () => NodeId.fromHex(TEST_NODE_ID_HEX);

export const addressesBytes = () =>
  new Uint8Array([
    //length
    ...bytesForInt(2),
    ...addressBytes(),
    ...addressBytes(),
  ]);

export const addresses = () => makeList(address);
