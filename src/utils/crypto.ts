/**
 * @packageDocumentation
 * @module Utils-Crypto
 */
import { Buffer } from "buffer/";
import {Crypto} from  "@peculiar/webcrypto";
import createHash from "create-hash";

/**
 * Helper utility for encryption and password hashing, browser-safe.
 * Encryption is using XChaCha20Poly1305 with a random public nonce.
 */
export class CryptoHelpers {

    protected memlimit:number = 524288000;
    protected opslimit:number = 3;
    protected libsodium:typeof libsodiumWrapper;

    /**
     * Retrieves the memory limit that can be spent generating password-safe hashes.
     */
    getMemoryLimit():number {
        return this.memlimit;
    }

    /**
     * Sets the memory limit that can be spent generating password-safe hashes.
     * 
     * @param memlimit The number representing the memory limit, in bytes, that the password-safe algorithm can use
     */
    setMemoryLimit(memlimit:number) {
        this.memlimit = memlimit;
    }

    /**
     * Retrieves the cpu limit that can be spent generating password-safe hashes.
     */
    getOpsLimit():number {
        return this.opslimit;
    }

    /**
     * Retrieves the cpu limit that can be spent generating password-safe hashes.
     * 
     * @param opslimit The number representing the cpu limit that the password-safe algorithm can use. Lower is faster.
     */
    setOpsLimit(opslimit:number) {
        this.opslimit = opslimit;
    }

    /**
     * @ignore
     */
    protected async sodium(): Promise<typeof libsodiumWrapper> {
        if(!this.libsodium) this.libsodium = (libsodiumWrapper as typeof libsodiumWrapper);
        await this.libsodium.ready;
      
        return this.libsodium;
      }
      

    /**
     * Internal-intended function for cleaning passwords.
     * 
     * @param password 
     * @param salt 
     */
    async _pwcleaner(password:string,salt:Uint8Array):Promise<Uint8Array> {
        let sodium:typeof libsodiumWrapper = await this.sodium();
        let pw:Buffer = Buffer.from(password, 'utf8');
        let slt:Buffer;
        if(typeof salt === "undefined"){
            slt = Buffer.from(sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES));
        } else {
            slt = Buffer.from(salt);
        }
        let sha:Buffer = this.sha256(Buffer.concat([pw, slt]));
        let pwsalted:Uint8Array = Uint8Array.from(sha);
        return sodium.crypto_generichash(sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES, pwsalted);
    }

    /**
     * A SHA256 helper function.
     * 
     * @param message The message to hash
     * 
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the SHA256 hash of the message
     */
    sha256(message:string | Buffer | Uint8Array):Buffer {
        let buff:Buffer;
        if(typeof message === "string"){
            buff = Buffer.from(message, "utf8");
        } else {
            buff = Buffer.from(message);
        }
        return Buffer.from(createHash('sha256').update(buff).digest()); // ensures correct Buffer class is used
    }

    /**
     * Generates a randomized {@link https://github.com/feross/buffer|Buffer} to be used as a salt
     */
    async makeSalt():Promise<Buffer> {
        let sodium:typeof libsodiumWrapper = await this.sodium();
        return Buffer.from(sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES));
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
        let sodium:typeof libsodiumWrapper = await this.sodium();

        let slt:Uint8Array;
        if(typeof salt === "undefined"){
            slt = await this.makeSalt();
        } else {
            slt = Uint8Array.from(salt);
        }
        let hash:Uint8Array = sodium.crypto_pwhash(32, password, slt, this.opslimit, this.memlimit, sodium.crypto_pwhash_ALG_DEFAULT);
        return {salt:Buffer.from(slt), hash:Buffer.from(hash)};
    }

    /**
     * Encrypts plaintext with the provided password using XChaCha20Poly1305.
     * 
     * @param password A string for the password
     * @param plaintext The plaintext to encrypt
     * @param salt An optional {@link https://github.com/feross/buffer|Buffer} for the salt to use in the encryption process
     * 
     * @returns An object containing the "salt", "nonce", and "ciphertext", all as {@link https://github.com/feross/buffer|Buffer}.
     */
    async encrypt(password:string, plaintext:Buffer | string, salt:Buffer = undefined):Promise< {salt:Buffer; nonce:Buffer; ciphertext:Buffer} > {
        let sodium:typeof libsodiumWrapper = await this.sodium();
        let slt:Uint8Array;
        if(typeof salt === "undefined"){
            slt = await this.makeSalt();
        } else {
            slt = Uint8Array.from(salt);
        }

        let pt:Uint8Array;
        if(plaintext instanceof Buffer){
            pt = Uint8Array.from(plaintext);
        } else {
            pt = Uint8Array.from(Buffer.from(plaintext, "utf8"));
        }
        let nonce:Uint8Array = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
        let pkey:Uint8Array = await this._pwcleaner(password, slt);
        let ciphertext:Uint8Array = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(pt, "AVALANCHE", null, nonce, pkey);
    
        return {
            salt:Buffer.from(slt), 
            nonce:Buffer.from(nonce), 
            ciphertext:Buffer.from(ciphertext)
        }

    }

    /**
     * Decrypts ciphertext with the provided password, nonce, ans salt. 
     * 
     * @param password A string for the password
     * @param ciphertext A {@link https://github.com/feross/buffer|Buffer} for the ciphertext
     * @param salt A {@link https://github.com/feross/buffer|Buffer} for the salt
     * @param nonce A {@link https://github.com/feross/buffer|Buffer} for the nonce
     */
    async decrypt(password:string, ciphertext:Buffer, salt:Buffer, nonce:Buffer):Promise<Buffer> {
        let sodium:typeof libsodiumWrapper = await this.sodium();
        let pkey:Uint8Array = await this._pwcleaner(password, Uint8Array.from(salt));
        let pt:Uint8Array = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, Uint8Array.from(ciphertext), "AVALANCHE", Uint8Array.from(nonce), pkey);
        return Buffer.from(pt);
    } 

    constructor() {}
}