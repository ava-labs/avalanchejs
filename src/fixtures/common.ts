import { Address } from '../serializable/fxs/common/address';
import { Id } from '../serializable/fxs/common/id';
import { bytesForInt } from './utils/bytesFor';
import { makeList } from './utils/makeList';

export const addressBytes = () =>
  new Uint8Array([
    0x8d, 0xb9, 0x7c, 0x7c, 0xec, 0xe2, 0x49, 0xc2, 0xb9, 0x8b, 0xdc, 0x02,
    0x26, 0xcc, 0x4c, 0x2a, 0x57, 0xbf, 0x52, 0xfc,
  ]);

export const address = () =>
  Address.fromHex('8db97c7cece249c2b98bdc0226cc4c2a57bf52fc');

export const idBytes = () =>
  new Uint8Array([
    0xdb, 0xcf, 0x89, 0x0f, 0x77, 0xf4, 0x9b, 0x96, 0x85, 0x76, 0x48, 0xb7,
    0x2b, 0x77, 0xf9, 0xf8, 0x29, 0x37, 0xf2, 0x8a, 0x68, 0x70, 0x4a, 0xf0,
    0x5d, 0xa0, 0xdc, 0x12, 0xba, 0x53, 0xf2, 0xdb,
  ]);

export const id = () =>
  Id.fromHex(
    'dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db',
  );

export const addressesBytes = () =>
  new Uint8Array([
    //length
    ...bytesForInt(2),
    ...addressBytes(),
    ...addressBytes(),
  ]);

export const addresses = () => makeList(address);
