/**
 * @packageDocumentation
 * @module Utils-HDNode
 */

import { Buffer } from 'buffer/'
import hdnode from 'hdkey'

/**
 * BIP32 hierarchical deterministic keys.
 */

export default class HDNode {
  private hdkey: any
  publicKey: Buffer
  privateKey: Buffer
  chainCode: Buffer
  privateExtendedKey: string
  publicExtendedKey: string

  /**
  * Derives the HDNode at path from the current HDNode.
  * @param path 
  * @returns derived child HDNode
  */
  derive(path: string): HDNode {
    const hdKey = this.hdkey.derive(path)
    let hdNode: HDNode
    if (hdKey.privateExtendedKey != null) {
      hdNode = new HDNode(hdKey.privateExtendedKey)
    } else {
      hdNode = new HDNode(hdKey.publicExtendedKey)
    }
    return hdNode
  }

  /**
  * Signs the buffer hash with the private key using secp256k1 and returns the signature as a buffer.
  * @param hash 
  * @returns signature as a Buffer
  */
  sign(hash: Buffer): Buffer {
    const sig: Buffer = this.hdkey.sign(hash)
    return Buffer.from(sig)
  }

  /**
  * Verifies that the signature is valid for hash and the HDNode's public key using secp256k1.
  * @param hash 
  * @param signature 
  * @returns true for valid, false for invalid.
  * @throws if the hash or signature is the wrong length.
  */
  verify(hash: Buffer, signature: Buffer): boolean {
    return this.hdkey.verify(hash, signature)
  }

  /**
  * Wipes all record of the private key from the HDNode instance.
  * After calling this method, the instance will behave as if it was created via an xpub.
  */
  wipePrivateData() {
    this.privateKey = null
    this.privateExtendedKey = null
    this.hdkey.wipePrivateData()
  }

  /**
  * Creates an HDNode from a master seed or an extended public/private key
  * @param from seed or key to create HDNode from
  */
  constructor(from: string | Buffer) {
    if (Buffer.isBuffer(from)) {
      from = from.toString()
    }
    if (from.substring(0, 2) === "xp") {
      // create HDNode from extended public or private key
      this.hdkey = hdnode.fromExtendedKey(from)
    } else {
      this.hdkey = hdnode.fromMasterSeed(Buffer.from(from) as unknown as globalThis.Buffer)
    }
    this.publicKey = this.hdkey.publicKey
    this.privateKey = this.hdkey.privateKey
    this.chainCode = this.hdkey.chainCode
    this.privateExtendedKey = this.hdkey.privateExtendedKey
    this.publicExtendedKey = this.hdkey.publicExtendedKey
  }
}