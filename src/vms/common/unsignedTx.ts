import { sha256 } from '@noble/hashes/sha256';
import { emptySignature } from '../../constants/zeroValue';
import { SignedTx } from '../../serializable/avax';
import { Utxo } from '../../serializable/avax/utxo';
import type { VM } from '../../serializable/constants';
import { ValidVMs } from '../../serializable/constants';
import { Address } from '../../serializable/fxs/common';
import { Credential } from '../../serializable/fxs/secp256k1';
import {
  bufferToHex,
  hexToBuffer,
  publicKeyBytesToAddress,
  recoverPublicKey,
} from '../../utils';
import { AddressMaps } from '../../utils/addressMap';
import { getManagerForVM, packTx } from '../../utils/packTx';
import type { Transaction } from './transaction';

type UnsingedTxSerialize = {
  txBytes: string;
  utxos: string[];
  addressMaps: string;
  vm: string;
  codecId: string;
};
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

  toJSON() {
    const codec = getManagerForVM(this.tx.vm).getDefaultCodec();
    const codecId = getManagerForVM(this.tx.vm).getDefaultCodecId();
    return JSON.stringify({
      codecId: codecId.toJSON(),
      vm: this.tx.vm,
      txBytes: bufferToHex(this.toBytes()),
      utxos: this.utxos.map((utxo) => bufferToHex(utxo.toBytes(codec))),
      addressMaps: this.addressMaps,
      credentials: this.credentials,
    });
  }

  static fromJSON(jsonString: string) {
    const res = JSON.parse(jsonString) as UnsingedTxSerialize;
    const fields = ['txBytes', 'utxos', 'addressMaps', 'vm', 'codecId'];
    if (!fields.every((field) => res[field])) {
      throw new Error(`invalid structure. must have ${fields.join(', ')}`);
    }
    const vm = res.vm as VM;
    if (!ValidVMs.includes(vm)) {
      throw new Error('invalid VM');
    }

    const manager = getManagerForVM(vm);
    const [codec, rest] = manager.getCodecFromBuffer(hexToBuffer(res.txBytes));
    const tx = codec.UnpackPrefix<Transaction>(rest)[0];

    const utxos = res.utxos.map(
      (utxo) => Utxo.fromBytes(hexToBuffer(utxo), codec)[0],
    );

    const addressMaps = AddressMaps.fromJSON(res.addressMaps);

    return new UnsignedTx(tx, utxos, addressMaps);
  }

  getSigIndices() {
    return this.tx.getSigIndices();
  }

  hasAddress(address: Address) {
    return this.addressMaps.has(address);
  }

  hasPubkey(pubKey: Uint8Array) {
    return this.hasAddress(new Address(this.publicKeyBytesToAddress(pubKey)));
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
    const publicKey = recoverPublicKey(unsignedHash, sig);
    this.addSignatureForPubKey(sig, publicKey);
  }

  private addSignatureForPubKey(sig: Uint8Array, publicKey: Uint8Array) {
    const addr = this.publicKeyBytesToAddress(publicKey);
    const coordinates = this.getSigIndicesForAddress(new Address(addr));
    if (coordinates) {
      coordinates.forEach(([index, subIndex]) => {
        this.addSignatureAt(sig, index, subIndex);
      });
    }
  }

  protected publicKeyBytesToAddress(pubKey: Uint8Array) {
    return publicKeyBytesToAddress(pubKey);
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
