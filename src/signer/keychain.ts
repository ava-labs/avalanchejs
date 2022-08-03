import { Address } from '../serializable/fxs/common';
import {
  bufferToHex,
  getPublicKey,
  printDeep,
  publicKeyBytesToAddress,
  sign,
} from '../utils';
import type { UnsignedTx } from '../vms/common/unsignedTx';

export interface Keychain {
  AddPrivateKey(privateKey: Uint8Array);
  RemovePrivateKey(privateKey: Uint8Array);
  addSignatures(unsignedTx: UnsignedTx): Promise<void>;
}

export class Secp256K1Keychain implements Keychain {
  addressToPrivateKey = new Map<string, Uint8Array>();
  constructor(private keys: Uint8Array[]) {
    keys.forEach((key) => this.AddPrivateKey(key));
  }

  AddPrivateKey(key: Uint8Array) {
    this.addressToPrivateKey.set(bufferToHex(this.addressFromPK(key)), key);
  }

  private addressFromPK(key) {
    return publicKeyBytesToAddress(getPublicKey(key));
  }

  RemovePrivateKey(privateKey: Uint8Array) {
    this.addressToPrivateKey.delete(
      bufferToHex(this.addressFromPK(privateKey)),
    );
  }

  async addSignatures(unsignedTx: UnsignedTx) {
    const unsignedBytes = unsignedTx.toBytes();
    const promises: Promise<void>[] = [];

    this.addressToPrivateKey.forEach((privateKey, addressHex) => {
      promises.push(
        (async () => {
          const address = Address.fromHex(addressHex);
          printDeep(address);
          if (unsignedTx.hasAddress(address)) {
            const signature = await sign(unsignedBytes, privateKey);
            unsignedTx.addSignatureForAddress(signature, address);
          }
        })(),
      );
    });

    await Promise.all(promises);
  }
}
