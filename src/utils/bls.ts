import { bls12_381 as bls } from '@noble/curves/bls12-381';
import type { ProjPointType } from '@noble/curves/abstract/weierstrass';
import { hexToBuffer } from './buffer';

const { Fp2 } = bls.fields;
export type PublicKey = ProjPointType<bigint>;
export type SecretKey = bigint;
export type Signature = ProjPointType<typeof Fp2.ZERO>;
export type Message = ProjPointType<typeof Fp2.ZERO>;
const G1Point = bls.G1.ProjectivePoint;

export const PUBLIC_KEY_LENGTH = 48;
export const SIGNATURE_LENGTH = 96;

const ciphersuiteSignature = 'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_';
const ciphersuiteProofOfPossession =
  'BLS_POP_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_';

export function SecretKeyFromBytes(skBytes: Uint8Array | string): SecretKey {
  return bls.G1.normPrivateKeyToScalar(skBytes);
}

export function SecretKeyToBytes(sk: SecretKey): Uint8Array {
  return hexToBuffer(sk.toString(16));
}

export function PublicKeyFromBytes(pkBytes: Uint8Array | string): PublicKey {
  return G1Point.fromHex(pkBytes);
}

export function PublicKeyToBytes(pk: PublicKey): Uint8Array {
  return pk.toRawBytes();
}

export function SignatureFromBytes(sigBytes: Uint8Array): Signature {
  return bls.Signature.fromHex(sigBytes);
}

export function SignatureToBytes(sig: Signature): Uint8Array {
  return sig.toRawBytes();
}

export function Verify(
  pk: PublicKey,
  sig: Signature,
  msg: Uint8Array | string | Message,
): boolean {
  return bls.verify(sig, msg, pk, {
    DST: ciphersuiteSignature,
  });
}

export function VerifyProofOfPossession(
  pk: PublicKey,
  sig: Signature,
  msg: Uint8Array | string | Message,
): boolean {
  return bls.verify(sig, msg, pk, {
    DST: ciphersuiteProofOfPossession,
  });
}

// TODO: Uncomment once https://github.com/paulmillr/noble-curves/pull/117 is merged.
// export function Sign(msg: Uint8Array | string, sk: SecretKey): Uint8Array {
//     return bls.sign(msg, sk, {
//         DST: ciphersuiteSignature
//     })
// }

// export function SignProofOfPossession(msg: Uint8Array | string, sk: SecretKey): Uint8Array {
//     return bls.sign(msg, sk, {
//         DST: ciphersuiteProofOfPossession
//     })
// }
