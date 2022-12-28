/**
 * @packageDocumentation
 * @module API-PlatformVM-ProofOfPossession
 */
import { Buffer } from "buffer/"

// A BLS public key and a proof of possession of the key.
// export class ProofOfPossession extends Serializable {
export class ProofOfPossession {
  protected _typeName = "ProofOfPossession"
  protected _typeID = undefined

  /**
   * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the publicKey
   */
  getPublicKey(): Buffer {
    return this.publicKey
  }

  /**
   * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the signature
   */
  getSignature(): Buffer {
    return this.signature
  }

  protected publicKey: Buffer = Buffer.alloc(48)
  protected signature: Buffer = Buffer.alloc(96)

  /**
   * Class representing a Proof of Possession
   *
   * @param publicKey {@link https://github.com/feross/buffer|Buffer} for the public key
   * @param signature {@link https://github.com/feross/buffer|Buffer} for the signature
   */
  constructor(publicKey: Buffer, signature: Buffer) {
    this.publicKey = publicKey
    this.signature = signature
  }
}
