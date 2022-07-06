import { OutputOwners } from '../fxs/secp256k1';
import { BigIntPr, Int } from '../primitives';

export const zeroOutputOwners = new OutputOwners(
  new BigIntPr(0n),
  new Int(0),
  [],
);
