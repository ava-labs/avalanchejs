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

  /**
   * Retrieves the index buffer for the signature
   */
  getBytes = (): Buffer => this.bytes

  clone(): this {
    let newbase: SigIdx = new SigIdx()
    newbase.fromBuffer(this.toBuffer())
    return newbase as this
  }

  create(): this {
    return new SigIdx() as this
  }

  /**
   * Type representing a [[Signature]] index used in [[Input]]
   */
  constructor(addressIdx?: number, address?: Buffer) {
    super()
    if (addressIdx) this.bytes.writeUInt32BE(addressIdx, 0)
    if (address) this.setSource(address)
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

  create(): this {
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

  getCredentialID(): number {
    return this._typeID
  }

  /**
   * Set the codecID
   *
   * @param codecID The codecID to set
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export class SECPMultisigCredential extends Credential {
  protected _typeName = "SECPMultisigCredential"
  protected _typeID = undefined

  protected sigIdxs: SigIdx[] = []

  /**
   * Adds a SignatureIndex to the credentials.
   */
  addSSignatureIndex = (sigIdx: SigIdx): void => {
    this.sigIdxs.push(sigIdx)
  }

  clone(): this {
    const newbase = new SECPMultisigCredential(this._typeID)
    newbase.fromBuffer(this.toBuffer())
    return newbase as this
  }

  create(...args: any[]): this {
    return new SECPMultisigCredential(
      args.length == 1 ? args[0] : this._typeID
    ) as this
  }

  select(id: number, ...args: any[]): Credential {
    if (id === this._typeID) return this.create(args)
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    const sigIdxlen: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.sigIdxs = []
    for (let i = 0; i < sigIdxlen; i++) {
      const sigIdx: SigIdx = new SigIdx()
      offset = sigIdx.fromBuffer(bytes, offset)
      this.sigIdxs.push(sigIdx)
    }
    return offset
  }

  toBuffer(): Buffer {
    // The signatures
    const superBuff: Buffer = super.toBuffer()

    const sigIdxlen: Buffer = Buffer.alloc(4)
    sigIdxlen.writeInt32BE(this.sigIdxs.length, 0)
    const barr: Buffer[] = [superBuff, sigIdxlen]
    let bsize: number = superBuff.length + sigIdxlen.length

    for (const sigIdx of this.sigIdxs) {
      const sigIdxBuff: Buffer = sigIdx.toBuffer()
      bsize += sigIdxBuff.length
      barr.push(sigIdxBuff)
    }
    return Buffer.concat(barr, bsize)
  }

  constructor(typeID: number, sigIdxs?: SigIdx[], sigarray?: Signature[]) {
    super(sigarray)
    this._typeID = typeID
    if (sigIdxs) this.sigIdxs = sigIdxs
  }
}
