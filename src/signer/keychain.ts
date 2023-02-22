import { bufferToHex, getPublicKey, hexToBuffer, sign } from '../utils';
import type { UnsignedTx } from '../vms/common/unsignedTx';

export interface Keychain {
  addPrivateKey(privateKey: Uint8Array);
  removePrivateKey(privateKey: Uint8Array);
  addSignatures(unsignedTx: UnsignedTx): Promise<void>;
}

export class Secp256K1Keychain implements Keychain {
  private publicKeyToPrivateKey = new Map<string, Uint8Array>();
  constructor(private keys: Uint8Array[] = []) {
    keys.forEach((key) => this.addPrivateKey(key));
  }

  addPrivateKey(key: Uint8Array) {
    this.publicKeyToPrivateKey.set(
      bufferToHex(this.publicKeyFromPrivate(key)),
      key,
    );
  }

  private publicKeyFromPrivate(key) {
    return getPublicKey(key);
  }

  removePrivateKey(privateKey: Uint8Array) {
    this.publicKeyToPrivateKey.delete(
      bufferToHex(this.publicKeyFromPrivate(privateKey)),
    );
  }

  /*
  This is for the use case that we're getting a buffer from a dapp and we just sign and let the dapp
  figure out which signature to use and where to put it
  */
  async signBytes(unsignedTxBytes: Uint8Array) {
    const promises: Promise<void>[] = [];
    const publicKeyToSignatures: Record<string, Uint8Array> = {};
    this.publicKeyToPrivateKey.forEach((privateKey, publicKey) => {
      promises.push(
        (async () => {
          const signature = await sign(unsignedTxBytes, privateKey);
          publicKeyToSignatures[publicKey] = signature;
        })(),
      );
    });

    await Promise.all(promises);
    return publicKeyToSignatures;
  }

  async addSignatures(unsignedTx: UnsignedTx) {
    const unsignedBytes = unsignedTx.toBytes();
    const promises: Promise<void>[] = [];

    this.publicKeyToPrivateKey.forEach((privateKey, publicKey) => {
      if (unsignedTx.hasPubkey(hexToBuffer(publicKey))) {
        promises.push(
          (async () => {
            const signature = await sign(unsignedBytes, privateKey);
            unsignedTx.addSignature(signature);
          })(),
        );
      }
    });

    await Promise.all(promises);
  }
}
