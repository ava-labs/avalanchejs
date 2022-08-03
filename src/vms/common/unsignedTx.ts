import { sha256 } from '@noble/hashes/sha256';
import { emptySignature } from '../../constants/zeroValue';
import type { Utxo } from '../../serializable/avax/utxo';
import { SignedTx } from '../../serializable/avm';
import { Address } from '../../serializable/fxs/common';
import { Credential } from '../../serializable/fxs/secp256k1';
import {
  bufferToHex,
  hexToBuffer,
  publicKeyBytesToAddress,
  recoverPublicKey,
} from '../../utils';
import type { AddressMaps } from '../../utils/addressMap';
import { packTx } from '../../utils/packTx';
import type { Transaction } from './transaction';

export class UnsignedTx {
  credentials: Credential[];

  constructor(
    readonly tx: Transaction,
    readonly utxos: Utxo[],
    readonly addressMaps: AddressMaps,
  ) {
    this.credentials = this.tx
      .getSigIndices()
      .map((indicies) => new Credential(indicies.map(() => emptySignature)));
  }

  hasAddress(address: Address) {
    return this.addressMaps.has(address);
  }

  getAddresses() {
    return this.addressMaps.getAddresses();
  }

  getSigIndicesForAddress(address: Address) {
    return this.addressMaps.getSigIndicesForAddress(address);
  }

  getInputUtxos() {
    return this.utxos;
  }

  toBytes(): Uint8Array {
    return packTx(this.tx);
  }

  getBlockchainId() {
    return this.tx.getBlockchainId();
  }

  getTx() {
    return this.tx;
  }

  getSignedTx() {
    return new SignedTx(this.tx, this.credentials);
  }

  getCredentials(): Credential[] {
    return this.credentials as Credential[];
  }

  addSignatureAt(sig: Uint8Array, index: number, subIndex: number) {
    if (index >= this.getCredentials().length) {
      throw new Error('index out of bounds');
    }
    this.getCredentials()[index].setSignature(subIndex, sig);
  }

  addSignature(sig: Uint8Array) {
    const unsignedHash = sha256(this.toBytes());
    const addr = publicKeyBytesToAddress(recoverPublicKey(unsignedHash, sig));

    this.addSignatureForAddress(sig, new Address(addr));
  }

  addSignatureForAddress(sig: Uint8Array, addr: Address) {
    const coordinates = this.getSigIndicesForAddress(addr);
    if (coordinates) {
      coordinates.forEach(([index, subIndex]) => {
        this.addSignatureAt(sig, index, subIndex);
      });
    }
  }

  hasAllSignatures() {
    const allSigsHex = this.credentials.map((cred) => cred.getSignatures());
    const emptySignatureHex = emptySignature.toString();

    const unsignedHash = sha256(this.toBytes());

    const hasNoPlaceholders = allSigsHex.every((cred) => {
      return cred.every((sig) => {
        return sig !== emptySignatureHex;
      });
    });

    if (!hasNoPlaceholders) return false;
    let valid = true;

    this.addressMaps.forEach((coordinates, address) => {
      coordinates.forEach(([index, subIndex]) => {
        const sig = allSigsHex[index]?.[subIndex];
        if (!sig) {
          throw new Error('error: incorrect structure for credentials');
        }
        const sigBytes = hexToBuffer(sig);
        const publicKey = recoverPublicKey(unsignedHash, sigBytes);
        const derivedAddress = bufferToHex(publicKeyBytesToAddress(publicKey));
        if (address !== derivedAddress) {
          valid = false;
        }
      });
    });
    return valid;
  }

  getVM() {
    return this.tx.getVM();
  }
}
