import { serializable } from '../common/types';
import { ProofOfPossession } from './proofOfPossession';
import { pack, unpack } from '../../utils/struct';
import type { Codec } from '../codec';
import { TypeSymbols } from '../constants';
import * as bls from '../../utils/bls';

@serializable()
export class Signer {
  _type = TypeSymbols.Signer;

  constructor(public readonly proof: ProofOfPossession) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [Signer, Uint8Array] {
    const [proof, rest] = unpack(bytes, [ProofOfPossession], codec);
    return [new Signer(proof), rest];
  }

  toBytes(codec: Codec) {
    return pack([this.proof], codec);
  }
}

@serializable()
export class SignerEmpty {
  _type = TypeSymbols.SignerEmpty;

  static fromBytes(bytes: Uint8Array, codec: Codec): [SignerEmpty, Uint8Array] {
    const [rest] = unpack(bytes, [], codec);
    return [new SignerEmpty(), rest];
  }

  toBytes(codec: Codec) {
    return pack([], codec);
  }
}

export function createSignerOrSignerEmptyFromStrings(
  publicKey?: Uint8Array,
  signature?: Uint8Array,
) {
  return publicKey && signature
    ? new Signer(
        new ProofOfPossession(
          bls.PublicKeyFromBytes(publicKey),
          bls.SignatureFromBytes(signature),
        ),
      )
    : new SignerEmpty();
}
