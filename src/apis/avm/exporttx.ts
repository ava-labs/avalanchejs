/**
 * @packageDocumentation
 * @module API-AVM-ExportTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { AVMConstants } from "./constants"
import { TransferableOutput, AmountOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { BaseTx } from "./basetx"
import { DefaultNetworkID } from "../../utils/constants"
import BN from "bn.js"
import {
  Serialization,
  SerializedEncoding,
  SerializedType
} from "../../utils/serialization"
import {
  CodecIdError,
  ChainIdError,
  TransferableOutputError
} from "../../utils/errors"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()
const cb58: SerializedType = "cb58"
const buffer: SerializedType = "Buffer"

/**
 * Class representing an unsigned Export transaction.
 */
export class ExportTx extends BaseTx {
  protected _typeName = "ExportTx"
  protected _codecID = AVMConstants.LATESTCODEC
  protected _typeID =
    this._codecID === 0 ? AVMConstants.EXPORTTX : AVMConstants.EXPORTTX_CODECONE

  serialize(encoding: SerializedEncoding = "hex"): object {
    const fields: object = super.serialize(encoding)
    return {
      ...fields,
      destinationChain: serialization.encoder(
        this.destinationChain,
        encoding,
        buffer,
        cb58
      ),
      exportOuts: this.exportOuts.map((e) => e.serialize(encoding))
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.destinationChain = serialization.decoder(
      fields["destinationChain"],
      encoding,
      cb58,
      buffer,
      32
    )
    this.exportOuts = fields["exportOuts"].map(
      (e: object): TransferableOutput => {
        let eo: TransferableOutput = new TransferableOutput()
        eo.deserialize(e, encoding)
        return eo
      }
    )
    this.numOuts = Buffer.alloc(4)
    this.numOuts.writeUInt32BE(this.exportOuts.length, 0)
  }

  protected destinationChain: Buffer = undefined
  protected numOuts: Buffer = Buffer.alloc(4)
  protected exportOuts: TransferableOutput[] = []

  /**
   * Set the codecID
   *
   * @param codecID The codecID to set
   */
  setCodecID(codecID: number): void {
    if (codecID !== 0 && codecID !== 1) {
      /* istanbul ignore next */
      throw new CodecIdError(
        "Error - ExportTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    }
    this._codecID = codecID
    this._typeID =
      this._codecID === 0
        ? AVMConstants.EXPORTTX
        : AVMConstants.EXPORTTX_CODECONE
  }

  /**
   * Returns the id of the [[ExportTx]]
   */
  getTxType(): number {
    return this._typeID
  }

  /**
   * Returns an array of [[TransferableOutput]]s in this transaction.
   */
  getExportOutputs(): TransferableOutput[] {
    return this.exportOuts
  }

  /**
   * Returns the totall exported amount as a {@link https://github.com/indutny/bn.js/|BN}.
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
   * Returns a {@link https://github.com/feross/buffer|Buffer} for the destination chainid.
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
   * @param destinationChain Optional chainid which identifies where the funds will sent to
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
    this.destinationChain = destinationChain // no correction, if they don"t pass a chainid here, it will BOMB on toBuffer
    if (typeof exportOuts !== "undefined" && Array.isArray(exportOuts)) {
      for (let i: number = 0; i < exportOuts.length; i++) {
        if (!(exportOuts[`${i}`] instanceof TransferableOutput)) {
          throw new TransferableOutputError(
            `Error - ExportTx.constructor: invalid TransferableOutput in array parameter ${exportOuts}`
          )
        }
      }
      this.exportOuts = exportOuts
    }
  }
}
