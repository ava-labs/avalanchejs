import { ripemd160 } from '@noble/hashes/ripemd160';
import { sha256 } from '@noble/hashes/sha256';
import * as secp from '@noble/secp256k1';
import { Address } from 'micro-eth-signer';
import { concatBytes, hexToBuffer } from '../utils/buffer';

/** Number of bytes per signature */
export const SIGNATURE_LENGTH = 65;

export function randomPrivateKey() {
  return secp.utils.randomPrivateKey();
}

export function sign(msg: Uint8Array | string, privKey: Uint8Array) {
  return signHash(sha256(msg), privKey);
}

export async function signHash(hash: Uint8Array, privKey: Uint8Array) {
  const sig = await secp.signAsync(hash, privKey);

  if (sig.recovery !== undefined) {
    return concatBytes(sig.toCompactRawBytes(), new Uint8Array([sig.recovery]));
  } else {
    throw new Error(`Recovery bit is missing.`);
  }
}

export function recoverPublicKey(hash: Uint8Array | string, sig: Uint8Array) {
  const recoveryBit = sig.slice(-1);
  const secpSig = secp.Signature.fromCompact(sig.slice(0, -1)).addRecoveryBit(
    recoveryBit[0],
  );
  const point = secpSig.recoverPublicKey(hash);

  return point.toRawBytes(true);
}

export function getPublicKey(privKey: Uint8Array) {
  return secp.getPublicKey(privKey, true);
}

export function verify(
  sig: Uint8Array,
  hash: Uint8Array | string,
  publicKey: Uint8Array,
) {
  return secp.verify(sig.slice(0, -1), hash, publicKey);
}

export function publicKeyBytesToAddress(publicKey: Uint8Array) {
  return ripemd160(sha256(publicKey));
}

export function publicKeyToEthAddress(key: Uint8Array) {
  return hexToBuffer(Address.fromPublicKey(key));
}
