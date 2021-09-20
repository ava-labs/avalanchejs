/**
 * @packageDocumentation
 * @module Common-Signature
 */
import { NBytes } from "./nbytes"
import { Buffer } from "buffer/"
import BinTools from "../utils/bintools"
import {
  Serializable,
  Serialization,
  SerializedEncoding
} from "../utils/serialization"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Type representing a [[Signature]] index used in [[Input]]
 */
export class SigIdx extends NBytes {
  protected _typeName = "SigIdx"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      source: serialization.encoder(this.source, encoding, "Buffer", "hex")
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.source = serialization.decoder(
      fields["source"],
      encoding,
      "hex",
      "Buffer"
    )
  }

  protected source: Buffer = Buffer.alloc(20)
  protected bytes = Buffer.alloc(4)
  protected bsize = 4

  /**
   * Sets the source address for the signature
   */
  setSource = (address: Buffer) => {
    this.source = address
  }

  /**
   * Retrieves the source address for the signature
   */
  getSource = (): Buffer => this.source

  clone(): this {
    let newbase: SigIdx = new SigIdx()
    newbase.fromBuffer(this.toBuffer())
    return newbase as this
  }

  create(...args: any[]): this {
    return new SigIdx() as this
  }

  /**
   * Type representing a [[Signature]] index used in [[Input]]
   */
  constructor() {
    super()
  }
}

/**
 * Signature for a [[Tx]]
 */
export class Signature extends NBytes {
  protected _typeName = "Signature"
  protected _typeID = undefined

  //serialize and deserialize both are inherited

  protected bytes = Buffer.alloc(65)
  protected bsize = 65

  clone(): this {
    let newbase: Signature = new Signature()
    newbase.fromBuffer(this.toBuffer())
    return newbase as this
  }

  create(...args: any[]): this {
    return new Signature() as this
  }

  /**
   * Signature for a [[Tx]]
   */
  constructor() {
    super()
  }
}

export abstract class Credential extends Serializable {
  protected _typeName = "Credential"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      sigArray: this.sigArray.map((s) => s.serialize(encoding))
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.sigArray = fields["sigArray"].map((s: object) => {
      let sig: Signature = new Signature()
      sig.deserialize(s, encoding)
      return sig
    })
  }

  protected sigArray: Signature[] = []

  abstract getCredentialID(): number

  /**
   * Set the codecID
   *
   * @param codecID The codecID to set
   */
  setCodecID(codecID: number): void {}

  /**
   * Adds a signature to the credentials and returns the index off the added signature.
   */
  addSignature = (sig: Signature): number => {
    this.sigArray.push(sig)
    return this.sigArray.length - 1
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    const siglen: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.sigArray = []
    for (let i: number = 0; i < siglen; i++) {
      const sig: Signature = new Signature()
      offset = sig.fromBuffer(bytes, offset)
      this.sigArray.push(sig)
    }
    return offset
  }

  toBuffer(): Buffer {
    const siglen: Buffer = Buffer.alloc(4)
    siglen.writeInt32BE(this.sigArray.length, 0)
    const barr: Buffer[] = [siglen]
    let bsize: number = siglen.length
    for (let i: number = 0; i < this.sigArray.length; i++) {
      const sigbuff: Buffer = this.sigArray[`${i}`].toBuffer()
      bsize += sigbuff.length
      barr.push(sigbuff)
    }
    return Buffer.concat(barr, bsize)
  }

  abstract clone(): this
  abstract create(...args: any[]): this
  abstract select(id: number, ...args: any[]): Credential
  constructor(sigarray: Signature[] = undefined) {
    super()
    if (typeof sigarray !== "undefined") {
      /* istanbul ignore next */
      this.sigArray = sigarray
    }
  }
}
