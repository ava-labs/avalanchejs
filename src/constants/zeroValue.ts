import { Id } from '../serializable/fxs/common';
import { OutputOwners } from '../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../serializable/primitives';
import { bufferToHex } from '../utils';

export const zeroOutputOwners = new OutputOwners(
  new BigIntPr(0n),
  new Int(0),
  [],
);

export const emptyId = new Id(bufferToHex(new Uint8Array(32)));
