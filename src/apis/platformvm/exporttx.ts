/**
 * @packageDocumentation
 * @module API-PlatformVM-ExportTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import { TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { BaseTx } from "./basetx"
import { DefaultNetworkID } from "../../utils/constants"
import BN from "bn.js"
import { AmountOutput } from "../platformvm/outputs"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import { ChainIdError, TransferableOutputError } from "../../utils/errors"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Class representing an unsigned Export transaction.
 */
export class ExportTx extends BaseTx {
  protected _typeName = "ExportTx"
  protected _typeID = PlatformVMConstants.EXPORTTX

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      destinationChain: serialization.encoder(
        this.destinationChain,
        encoding,
        "Buffer",
        "cb58"
      ),
      exportOuts: this.exportOuts.map((e) => e.serialize(encoding))
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.destinationChain = serialization.decoder(
      fields["destinationChain"],
      encoding,
      "cb58",
      "Buffer",
      32
    )
    this.exportOuts = fields["exportOuts"].map((e: object) => {
      let eo: TransferableOutput = new TransferableOutput()
      eo.deserialize(e, encoding)
      return eo
    })
    this.numOuts = Buffer.alloc(4)
    this.numOuts.writeUInt32BE(this.exportOuts.length, 0)
  }

  protected destinationChain: Buffer = Buffer.alloc(32)
  protected numOuts: Buffer = Buffer.alloc(4)
  protected exportOuts: TransferableOutput[] = []

  /**
   * Returns the id of the [[ExportTx]]
   */
  getTxType(): number {
    return PlatformVMConstants.EXPORTTX
  }

  /**
   * Returns an array of [[TransferableOutput]]s in this transaction.
   */
  getExportOutputs(): TransferableOutput[] {
    return this.exportOuts
  }

  /**
   * Returns the total exported amount as a {@link https://github.com/indutny/bn.js/|BN}.
   */
  getExportTotal(): BN {
    let val: BN = new BN(0)
    for (let i: number = 0; i < this.exportOuts.length; i++) {
      val = val.add(
        (this.exportOuts[`${i}`].getOutput() as AmountOutput).getAmount()
      )
    }
    return val
  }

  getTotalOuts(): TransferableOutput[] {
    return [
      ...(this.getOuts() as TransferableOutput[]),
      ...this.getExportOutputs()
    ]
  }

  /**
   * Returns the destinationChain as a {@link https://github.com/feross/buffer|Buffer}
   */
  getDestinationChain(): Buffer {
    return this.destinationChain
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[ExportTx]], parses it, populates the class, and returns the length of the [[ExportTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ExportTx]]
   *
   * @returns The length of the raw [[ExportTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    this.destinationChain = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    this.numOuts = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const numOuts: number = this.numOuts.readUInt32BE(0)
    for (let i: number = 0; i < numOuts; i++) {
      const anOut: TransferableOutput = new TransferableOutput()
      offset = anOut.fromBuffer(bytes, offset)
      this.exportOuts.push(anOut)
    }
    return offset
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
    this.numOuts.writeUInt32BE(this.exportOuts.length, 0)
    let barr: Buffer[] = [super.toBuffer(), this.destinationChain, this.numOuts]
    this.exportOuts = this.exportOuts.sort(TransferableOutput.comparator())
    for (let i: number = 0; i < this.exportOuts.length; i++) {
      barr.push(this.exportOuts[`${i}`].toBuffer())
    }
    return Buffer.concat(barr)
  }

  clone(): this {
    let newbase: ExportTx = new ExportTx()
    newbase.fromBuffer(this.toBuffer())
    return newbase as this
  }

  create(...args: any[]): this {
    return new ExportTx(...args) as this
  }

  /**
   * Class representing an unsigned Export transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param destinationChain Optional chainid which identifies where the funds will send to.
   * @param exportOuts Array of [[TransferableOutputs]]s used in the transaction
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    destinationChain: Buffer = undefined,
    exportOuts: TransferableOutput[] = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    this.destinationChain = destinationChain //do not correct, it should bomb on toBuffer if not provided
    if (typeof exportOuts !== "undefined" && Array.isArray(exportOuts)) {
      for (let i: number = 0; i < exportOuts.length; i++) {
        if (!(exportOuts[`${i}`] instanceof TransferableOutput)) {
          throw new TransferableOutputError(
            "Error - ExportTx.constructor: invalid TransferableOutput in array parameter 'exportOuts'"
          )
        }
      }
      this.exportOuts = exportOuts
    }
  }
}
