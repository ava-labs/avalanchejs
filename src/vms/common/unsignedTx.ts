import { sha256 } from '@noble/hashes/sha256';
import { emptySignature } from '../../constants/zeroValue';
import { SignedTx } from '../../serializable/avax';
import { Utxo } from '../../serializable/avax/utxo';
import type { VM } from '../../serializable/constants';
import { ValidVMs } from '../../serializable/constants';
import { Address } from '../../serializable/fxs/common';
import { Credential } from '../../serializable/fxs/secp256k1';
import { bufferToHex, hexToBuffer } from '../../utils';
import { secp256k1 } from '../../crypto';
import { AddressMaps } from '../../utils/addressMap';
import { getManagerForVM, packTx } from '../../utils/packTx';
import type { Transaction } from './transaction';

type UnsingedTxSerialize = {
  txBytes: string;
  utxos: string[];
  addressMaps: [string, number][][];
  vm: string;
  codecId: string;
  credentials: string[][];
};
export class UnsignedTx {
  credentials: Credential[];
  constructor(
    readonly tx: Transaction,
    readonly utxos: readonly Utxo[],
    readonly addressMaps: AddressMaps,
    credentials?: Credential[],
  ) {
    if (credentials) {
      this.credentials = credentials;
      return;
    }
    this.credentials = this.tx
      .getSigIndices()
      .map((indicies) => new Credential(indicies.map(() => emptySignature)));
  }

  toJSON() {
    const codec = getManagerForVM(this.tx.vm).getDefaultCodec();
    const codecId = getManagerForVM(this.tx.vm).getDefaultCodecId();
    return {
      codecId: codecId,
      vm: this.tx.vm,
      txBytes: bufferToHex(this.toBytes()),
      utxos: this.utxos.map((utxo) => bufferToHex(utxo.toBytes(codec))),
      addressMaps: this.addressMaps,
      credentials: this.credentials,
    };
  }

  static fromJSON(jsonString: string) {
    const res = JSON.parse(jsonString) as UnsingedTxSerialize;

    const fields = [
      'txBytes',
      'utxos',
      'addressMaps',
      'vm',
      'codecId',
      'credentials',
    ];

    fields.forEach((field) => {
      if (!res[field]) {
        throw new Error(
          `invalid structure. must have ${fields.join(', ')}, missing ${field}`,
        );
      }
    });

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

    const credentials = res.credentials.map((credStr) =>
      Credential.fromJSON(credStr),
    );
    return new UnsignedTx(tx, utxos, addressMaps, credentials);
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
    const useReorderedIndices = this.getSigIndices().some(
      (sigIndices, credIndex) => {
        const signaturesLength = this.credentials[credIndex].toJSON().length;
        const maxSigIndex = Math.max(...sigIndices);

        return maxSigIndex > signaturesLength - 1;
      },
    );

    return this.addressMaps.getSigIndicesForAddress(
      address,
      useReorderedIndices,
    );
  }

  getSigIndicesForPubKey(pubkey: Uint8Array) {
    const addrAvax = this.publicKeyBytesToAddress(pubkey);
    const addrEvm = secp256k1.publicKeyToEthAddress(pubkey);

    // Check against both addresses
    const coordinatesAvax = this.getSigIndicesForAddress(new Address(addrAvax));
    const coordinatesEvm = this.getSigIndicesForAddress(new Address(addrEvm));

    return coordinatesAvax || coordinatesEvm;
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
    const publicKey = secp256k1.recoverPublicKey(unsignedHash, sig);
    this.addSignatureForPubKey(sig, publicKey);
  }

  private addSignatureForPubKey(sig: Uint8Array, publicKey: Uint8Array) {
    const coordinates = this.getSigIndicesForPubKey(publicKey);
    if (coordinates) {
      coordinates.forEach(([index, subIndex]) => {
        this.addSignatureAt(sig, index, subIndex);
      });
    }
  }

  protected publicKeyBytesToAddress(pubKey: Uint8Array) {
    return secp256k1.publicKeyBytesToAddress(pubKey);
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

    this.addressMaps.forEach((coordinates) => {
      coordinates.forEach(([index, subIndex]) => {
        const sig = allSigsHex[index]?.[subIndex];
        if (!sig) {
          throw new Error('error: incorrect structure for credentials');
        }
        const sigBytes = hexToBuffer(sig);
        const publicKey = secp256k1.recoverPublicKey(unsignedHash, sigBytes);
        if (!this.hasPubkey(publicKey)) {
          valid = false;
        }
      });
    }, true);
    return valid;
  }

  getVM() {
    return this.tx.getVM();
  }
}
