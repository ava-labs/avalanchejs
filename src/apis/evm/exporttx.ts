/**
 * @packageDocumentation
 * @module API-EVM-ExportTx
 */

import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { EVMConstants } from "./constants"
import { KeyChain, KeyPair } from "./keychain"
import { EVMBaseTx } from "./basetx"
import { SelectCredentialClass } from "./credentials"
import { Signature, SigIdx, Credential } from "../../common/credentials"
import { EVMInput } from "./inputs"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import { TransferableOutput } from "./outputs"
import {
  ChainIdError,
  EVMInputError,
  TransferableOutputError
} from "../../utils/errors"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serializer: Serialization = Serialization.getInstance()

export class ExportTx extends EVMBaseTx {
  protected _typeName = "ExportTx"
  protected _typeID = EVMConstants.EXPORTTX

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      destinationChain: serializer.encoder(
        this.destinationChain,
        encoding,
        "Buffer",
        "cb58"
      ),
      exportedOutputs: this.exportedOutputs.map((i) => i.serialize(encoding))
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.destinationChain = serializer.decoder(
      fields["destinationChain"],
      encoding,
      "cb58",
      "Buffer",
      32
    )
    this.exportedOutputs = fields["exportedOutputs"].map((i: object) => {
      let eo: TransferableOutput = new TransferableOutput()
      eo.deserialize(i, encoding)
      return eo
    })
    this.numExportedOutputs = Buffer.alloc(4)
    this.numExportedOutputs.writeUInt32BE(this.exportedOutputs.length, 0)
  }

  protected destinationChain: Buffer = Buffer.alloc(32)
  protected numInputs: Buffer = Buffer.alloc(4)
  protected inputs: EVMInput[] = []
  protected numExportedOutputs: Buffer = Buffer.alloc(4)
  protected exportedOutputs: TransferableOutput[] = []

  /**
   * Returns the destinationChain as a {@link https://github.com/feross/buffer|Buffer}
   */
  getDestinationChain(): Buffer {
    return this.destinationChain
  }

  /**
   * Returns the inputs as an array of [[EVMInputs]]
   */
  getInputs(): EVMInput[] {
    return this.inputs
  }

  /**
   * Returns the outs as an array of [[EVMOutputs]]
   */
  getExportedOutputs(): TransferableOutput[] {
    return this.exportedOutputs
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ExportTx]].
   */
  toBuffer(): Buffer {
    if (typeof this.destinationChain === "undefined") {
      throw new ChainIdError(
        "ExportTx.toBuffer -- this.destinationChain is undefined"
      )
    }
    this.numInputs.writeUInt32BE(this.inputs.length, 0)
    this.numExportedOutputs.writeUInt32BE(this.exportedOutputs.length, 0)
    let barr: Buffer[] = [
      super.toBuffer(),
      this.destinationChain,
      this.numInputs
    ]
    let bsize: number =
      super.toBuffer().length +
      this.destinationChain.length +
      this.numInputs.length
    this.inputs.forEach((importIn: EVMInput) => {
      bsize += importIn.toBuffer().length
      barr.push(importIn.toBuffer())
    })
    bsize += this.numExportedOutputs.length
    barr.push(this.numExportedOutputs)
    this.exportedOutputs.forEach((out: TransferableOutput) => {
      bsize += out.toBuffer().length
      barr.push(out.toBuffer())
    })
    return Buffer.concat(barr, bsize)
  }

  /**
   * Decodes the [[ExportTx]] as a {@link https://github.com/feross/buffer|Buffer} and returns the size.
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    this.destinationChain = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    this.numInputs = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const numInputs: number = this.numInputs.readUInt32BE(0)
    for (let i: number = 0; i < numInputs; i++) {
      const anIn: EVMInput = new EVMInput()
      offset = anIn.fromBuffer(bytes, offset)
      this.inputs.push(anIn)
    }
    this.numExportedOutputs = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const numExportedOutputs: number = this.numExportedOutputs.readUInt32BE(0)
    for (let i: number = 0; i < numExportedOutputs; i++) {
      const anOut: TransferableOutput = new TransferableOutput()
      offset = anOut.fromBuffer(bytes, offset)
      this.exportedOutputs.push(anOut)
    }
    return offset
  }

  /**
   * Returns a base-58 representation of the [[ExportTx]].
   */
  toString(): string {
    return bintools.bufferToB58(this.toBuffer())
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
    this.inputs.forEach((input: EVMInput) => {
      const cred: Credential = SelectCredentialClass(input.getCredentialID())
      const sigidxs: SigIdx[] = input.getSigIdxs()
      sigidxs.forEach((sigidx: SigIdx) => {
        const keypair: KeyPair = kc.getKey(sigidx.getSource())
        const signval: Buffer = keypair.sign(msg)
        const sig: Signature = new Signature()
        sig.fromBuffer(signval)
        cred.addSignature(sig)
      })
      creds.push(cred)
    })
    return creds
  }

  /**
   * Class representing a ExportTx.
   *
   * @param networkID Optional networkID
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param destinationChain Optional destinationChain, default Buffer.alloc(32, 16)
   * @param inputs Optional array of the [[EVMInputs]]s
   * @param exportedOutputs Optional array of the [[EVMOutputs]]s
   */
  constructor(
    networkID: number = undefined,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    destinationChain: Buffer = Buffer.alloc(32, 16),
    inputs: EVMInput[] = undefined,
    exportedOutputs: TransferableOutput[] = undefined
  ) {
    super(networkID, blockchainID)
    this.destinationChain = destinationChain
    if (typeof inputs !== "undefined" && Array.isArray(inputs)) {
      inputs.forEach((input: EVMInput) => {
        if (!(input instanceof EVMInput)) {
          throw new EVMInputError(
            "Error - ExportTx.constructor: invalid EVMInput in array parameter 'inputs'"
          )
        }
      })
      if (inputs.length > 1) {
        inputs = inputs.sort(EVMInput.comparator())
      }
      this.inputs = inputs
    }
    if (
      typeof exportedOutputs !== "undefined" &&
      Array.isArray(exportedOutputs)
    ) {
      exportedOutputs.forEach((exportedOutput: TransferableOutput) => {
        if (!(exportedOutput instanceof TransferableOutput)) {
          throw new TransferableOutputError(
            "Error - ExportTx.constructor: TransferableOutput EVMInput in array parameter 'exportedOutputs'"
          )
        }
      })
      this.exportedOutputs = exportedOutputs
    }
  }
}
