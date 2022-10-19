/**
 * @packageDocumentation
 * @module API-PlatformVM-ImportTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import { TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { KeyChain, KeyPair } from "./keychain"
import { SelectCredentialClass } from "./credentials"
import { Signature, SigIdx, Credential } from "../../common/credentials"
import { BaseTx } from "./basetx"
import { DefaultNetworkID } from "../../utils/constants"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import { ChainIdError, TransferableInputError } from "../../utils/errors"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Class representing an unsigned Import transaction.
 */
export class ImportTx extends BaseTx {
  protected _typeName = "ImportTx"
  protected _typeID = PlatformVMConstants.IMPORTTX

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      sourceChain: serialization.encoder(
        this.sourceChain,
        encoding,
        "Buffer",
        "cb58"
      ),
      importIns: this.importIns.map((i) => i.serialize(encoding))
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.sourceChain = serialization.decoder(
      fields["sourceChain"],
      encoding,
      "cb58",
      "Buffer",
      32
    )
    this.importIns = fields["importIns"].map((i: object) => {
      let ii: TransferableInput = new TransferableInput()
      ii.deserialize(i, encoding)
      return ii
    })
    this.numIns = Buffer.alloc(4)
    this.numIns.writeUInt32BE(this.importIns.length, 0)
  }

  protected sourceChain: Buffer = Buffer.alloc(32)
  protected numIns: Buffer = Buffer.alloc(4)
  protected importIns: TransferableInput[] = []

  /**
   * Returns the id of the [[ImportTx]]
   */
  getTxType(): number {
    return this._typeID
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[ImportTx]], parses it, populates the class, and returns the length of the [[ImportTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ImportTx]]
   *
   * @returns The length of the raw [[ImportTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    this.sourceChain = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    this.numIns = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const numIns: number = this.numIns.readUInt32BE(0)
    for (let i: number = 0; i < numIns; i++) {
      const anIn: TransferableInput = new TransferableInput()
      offset = anIn.fromBuffer(bytes, offset)
      this.importIns.push(anIn)
    }
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ImportTx]].
   */
  toBuffer(): Buffer {
    if (typeof this.sourceChain === "undefined") {
      throw new ChainIdError(
        "ImportTx.toBuffer -- this.sourceChain is undefined"
      )
    }
    this.numIns.writeUInt32BE(this.importIns.length, 0)
    let barr: Buffer[] = [super.toBuffer(), this.sourceChain, this.numIns]
    this.importIns = this.importIns.sort(TransferableInput.comparator())
    for (let i: number = 0; i < this.importIns.length; i++) {
      barr.push(this.importIns[`${i}`].toBuffer())
    }
    return Buffer.concat(barr)
  }
  /**
   * Returns an array of [[TransferableInput]]s in this transaction.
   */
  getImportInputs(): TransferableInput[] {
    return this.importIns
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} for the source chainid.
   */
  getSourceChain(): Buffer {
    return this.sourceChain
  }

  /**
   * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
   *
   * @param msg A Buffer for the [[UnsignedTx]]
   * @param kc An [[KeyChain]] used in signing
   *
   * @returns An array of [[Credential]]s
   */
  sign(msg: Buffer, kc: KeyChain): Credential[] {
    const creds: Credential[] = super.sign(msg, kc)
    for (let i: number = 0; i < this.importIns.length; i++) {
      const cred: Credential = SelectCredentialClass(
        this.importIns[`${i}`].getInput().getCredentialID()
      )
      const sigidxs: SigIdx[] = this.importIns[`${i}`].getInput().getSigIdxs()
      for (let j: number = 0; j < sigidxs.length; j++) {
        const keypair: KeyPair = kc.getKey(sigidxs[`${j}`].getSource())
        const signval: Buffer = keypair.sign(msg)
        const sig: Signature = new Signature()
        sig.fromBuffer(signval)
        cred.addSignature(sig)
      }
      creds.push(cred)
    }
    return creds
  }

  clone(): this {
    let newbase: ImportTx = new ImportTx()
    newbase.fromBuffer(this.toBuffer())
    return newbase as this
  }

  create(...args: any[]): this {
    return new ImportTx(...args) as this
  }

  /**
   * Class representing an unsigned Import transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param sourceChain Optiona chainid for the source inputs to import. Default platform chainid.
   * @param importIns Array of [[TransferableInput]]s used in the transaction
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    sourceChain: Buffer = undefined,
    importIns: TransferableInput[] = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    this.sourceChain = sourceChain // do no correct, if it's wrong it'll bomb on toBuffer
    if (typeof importIns !== "undefined" && Array.isArray(importIns)) {
      for (let i: number = 0; i < importIns.length; i++) {
        if (!(importIns[`${i}`] instanceof TransferableInput)) {
          throw new TransferableInputError(
            "Error - ImportTx.constructor: invalid TransferableInput in array parameter 'importIns'"
          )
        }
      }
      this.importIns = importIns
    }
  }
}
