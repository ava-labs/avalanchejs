/**
 * @packageDocumentation
 * @module Utils-Crypto
 */
import { Buffer } from 'buffer/';
import { Crypto } from '@peculiar/webcrypto';
import createHash from 'create-hash';
import BinTools from './bintools';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Helper utility for encryption and password hashing, browser-safe.
 * Encryption is using XChaCha20Poly1305 with a random public nonce.
 */
export default class CryptoHelpers {
  protected crypto: Crypto = new Crypto();

  protected ivSize: number = 12;

  protected saltSize: number = 16;

  protected tagLength: number = 128;

  protected aesLength: number = 256;

  protected keygenIterations: number = 100000;

  /**
     * Internal-intended function for cleaning passwords.
     *
     * @param password
     * @param salt
     */
  _pwcleaner(password:string, slt:Buffer):Buffer {
    const pw:Buffer = Buffer.from(password, 'utf8');
    return this.sha256(Buffer.concat([pw, slt]));
  }
  /**
     * Internal-intended function for producing an intermediate key.
     *
     * @param pwkey
     */

  async _keyMaterial(pwkey:Buffer):Promise<CryptoKey> {
    return this.crypto.subtle.importKey(
      'raw',
      bintools.fromBufferToArrayBuffer(pwkey),
      { name: 'PBKDF2' },
      false,
      ['deriveKey'],
    );
  }

  /**
     * Internal-intended function for turning an intermediate key into a salted key.
     *
     * @param keyMaterial
     * @param salt
     */
  async _deriveKey(keyMaterial:CryptoKey, salt:Buffer):Promise<CryptoKey> {
    return this.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.keygenIterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: this.aesLength },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  /**
     * A SHA256 helper function.
     *
     * @param message The message to hash
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the SHA256 hash of the message
     */
  sha256(message:string | Buffer):Buffer {
    let buff:Buffer;
    if (typeof message === 'string') {
      buff = Buffer.from(message, 'utf8');
    } else {
      buff = Buffer.from(message);
    }
    return Buffer.from(createHash('sha256').update(buff).digest()); // ensures correct Buffer class is used
  }

  /**
     * Generates a randomized {@link https://github.com/feross/buffer|Buffer} to be used as a salt
     */
  makeSalt():Buffer {
    let salt = Buffer.alloc(this.saltSize);
    salt = Buffer.from(this.crypto.getRandomValues(new Uint8Array(salt)));
    return salt;
  }

  /**
     * Produces a password-safe hash.
     *
     * @param password A string for the password
     * @param salt An optional {@link https://github.com/feross/buffer|Buffer} containing a salt used in the password hash
     *
     * @returns An object containing the "salt" and the "hash" produced by this function, both as {@link https://github.com/feross/buffer|Buffer}.
     */
  async pwhash(password:string, salt:Buffer):Promise< {salt:Buffer; hash:Buffer} > {
    let slt:Buffer;
    if (salt instanceof Buffer) {
      slt = salt;
    } else {
      slt = this.makeSalt();
    }

    const hash:Buffer = this._pwcleaner(password, slt);
    return { salt: slt, hash };
  }

  /**
     * Encrypts plaintext with the provided password using XChaCha20Poly1305.
     *
     * @param password A string for the password
     * @param plaintext The plaintext to encrypt
     * @param salt An optional {@link https://github.com/feross/buffer|Buffer} for the salt to use in the encryption process
     *
     * @returns An object containing the "salt", "iv", and "ciphertext", all as {@link https://github.com/feross/buffer|Buffer}.
     */
  async encrypt(password:string,
    plaintext:Buffer | string,
    salt:Buffer = undefined):Promise< {salt:Buffer; iv:Buffer; ciphertext:Buffer} > {
    let slt:Buffer;
    if (plaintext instanceof Buffer) {
      slt = salt;
    } else {
      slt = this.makeSalt();
    }

    let pt:Buffer;
    if (plaintext instanceof Buffer) {
      pt = plaintext;
    } else {
      pt = Buffer.from(plaintext, 'utf8');
    }
    const pwkey:Buffer = this._pwcleaner(password, slt);
    const keyMaterial:CryptoKey = await this._keyMaterial(pwkey);
    const pkey:CryptoKey = await this._deriveKey(keyMaterial, slt);
    const iv:Buffer = Buffer.from(this.crypto.getRandomValues(new Uint8Array(this.ivSize)));

    const ciphertext:Buffer = Buffer.from(await this.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
        additionalData: new Uint8Array(slt),
        tagLength: this.tagLength,
      },
      pkey,
      new Uint8Array(pt),

    ));

    return {
      salt: slt,
      iv,
      ciphertext,
    };
  }

  /**
     * Decrypts ciphertext with the provided password, iv, and salt.
     *
     * @param password A string for the password
     * @param ciphertext A {@link https://github.com/feross/buffer|Buffer} for the ciphertext
     * @param salt A {@link https://github.com/feross/buffer|Buffer} for the salt
     * @param iv A {@link https://github.com/feross/buffer|Buffer} for the iv
     */
  async decrypt(password:string, ciphertext:Buffer, salt:Buffer, iv:Buffer):Promise<Buffer> {
    const pwkey:Buffer = this._pwcleaner(password, salt);
    const keyMaterial:CryptoKey = await this._keyMaterial(pwkey);
    const pkey:CryptoKey = await this._deriveKey(keyMaterial, salt);
    const pt:Buffer = Buffer.from(await this.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv), // The initialization vector you used to encrypt
        additionalData: new Uint8Array(salt), // The addtionalData you used to encrypt (if any)
        tagLength: 128, // The tagLength you used to encrypt (if any)
      },
      pkey, // from generateKey or importKey above
      new Uint8Array(ciphertext), // ArrayBuffer of the data
    ));
    return pt;
  }

  constructor() {}
}
