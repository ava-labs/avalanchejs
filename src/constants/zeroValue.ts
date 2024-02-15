import { Id } from '../serializable/fxs/common';
import { OutputOwners } from '../serializable/fxs/secp256k1';
import {
  SepkSignatureLength,
  Signature,
} from '../serializable/fxs/secp256k1/signature';
import { BigIntPr, Int } from '../serializable/primitives';

export const zeroOutputOwners = new OutputOwners(
  new BigIntPr(0n),
  new Int(0),
  [],
);

export const emptyId = new Id(new Uint8Array(32));
export const emptySignature = new Signature(
  new Uint8Array(Array(SepkSignatureLength).fill(0)),
);
