import { bls12_381 } from '@noble/curves/bls12-381';
import type { ProjPointType } from '@noble/curves/abstract/weierstrass';
import { hexToBuffer } from '../utils/buffer';

export type PublicKey = ProjPointType<bigint>;
export type SecretKey = bigint;
export type Signature = ProjPointType<typeof bls12_381.fields.Fp2.ZERO>;
export type Message = ProjPointType<typeof bls12_381.fields.Fp2.ZERO>;

export const PUBLIC_KEY_LENGTH = 48;
export const SIGNATURE_LENGTH = 96;

const signatureDST = 'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_';
const proofOfPossessionDST = 'BLS_POP_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_';

export function secretKeyFromBytes(skBytes: Uint8Array | string): SecretKey {
  return bls12_381.G1.normPrivateKeyToScalar(skBytes);
}

export function secretKeyToBytes(sk: SecretKey): Uint8Array {
  return hexToBuffer(sk.toString(16));
}

export function publicKeyFromBytes(pkBytes: Uint8Array | string): PublicKey {
  return bls12_381.G1.ProjectivePoint.fromHex(pkBytes);
}

export function publicKeyToBytes(pk: PublicKey): Uint8Array {
  return pk.toRawBytes();
}

export function signatureFromBytes(sigBytes: Uint8Array): Signature {
  return bls12_381.Signature.fromHex(sigBytes);
}

export function signatureToBytes(sig: Signature): Uint8Array {
  return sig.toRawBytes();
}

export function verify(
  pk: PublicKey,
  sig: Signature,
  msg: Uint8Array | string | Message,
): boolean {
  return bls12_381.verify(sig, msg, pk, {
    DST: signatureDST,
  });
}

export function verifyProofOfPossession(
  pk: PublicKey,
  sig: Signature,
  msg: Uint8Array | string | Message,
): boolean {
  return bls12_381.verify(sig, msg, pk, {
    DST: proofOfPossessionDST,
  });
}

export function sign(msg: Uint8Array | string, sk: SecretKey): Uint8Array {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error Will error until a version of @noble/curves is released with https://github.com/paulmillr/noble-curves/pull/117
  return bls12_381.sign(msg, sk, {
    DST: signatureDST,
  });
}

export function signProofOfPossession(
  msg: Uint8Array | string,
  sk: SecretKey,
): Uint8Array {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error Will error until a version of @noble/curves is released with https://github.com/paulmillr/noble-curves/pull/117
  return bls12_381.sign(msg, sk, {
    DST: proofOfPossessionDST,
  });
}
