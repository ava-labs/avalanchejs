import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import * as secp from '@noble/secp256k1';
import { concatBytes } from './buffer';

export function randomPrivateKey() {
  return secp.utils.randomPrivateKey();
}

export function sign(msg: Uint8Array | string, privKey: Uint8Array) {
  return signHash(sha256(msg), privKey);
}

export async function signHash(hash: Uint8Array, privKey: Uint8Array) {
  const sig = await secp.sign(hash, privKey, {
    recovered: true,
    der: false,
  });

  return concatBytes(sig[0], new Uint8Array([sig[1]]));
}

export function recoverPublicKey(hash: Uint8Array | string, sig: Uint8Array) {
  return secp.recoverPublicKey(
    hash,
    sig.slice(0, -1),
    sig[sig.length - 1],
    true,
  );
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
