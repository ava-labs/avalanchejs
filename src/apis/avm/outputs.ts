/**
 * @packageDocumentation
 * @module API-AVM-Outputs
 */
import { Buffer } from "buffer/"
import BN from "bn.js"
import BinTools from "../../utils/bintools"
import { AVMConstants } from "./constants"
import {
  Output,
  StandardAmountOutput,
  StandardTransferableOutput,
  BaseNFTOutput
} from "../../common/output"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import { OutputIdError, CodecIdError } from "../../utils/errors"

const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Takes a buffer representing the output and returns the proper Output instance.
 *
 * @param outputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Output]]-extended class.
 */
export const SelectOutputClass = (outputid: number, ...args: any[]): Output => {
  if (
    outputid === AVMConstants.SECPXFEROUTPUTID ||
    outputid === AVMConstants.SECPXFEROUTPUTID_CODECONE
  ) {
    return new SECPTransferOutput(...args)
  } else if (
    outputid === AVMConstants.SECPMINTOUTPUTID ||
    outputid === AVMConstants.SECPMINTOUTPUTID_CODECONE
  ) {
    return new SECPMintOutput(...args)
  } else if (
    outputid === AVMConstants.NFTMINTOUTPUTID ||
    outputid === AVMConstants.NFTMINTOUTPUTID_CODECONE
  ) {
    return new NFTMintOutput(...args)
  } else if (
    outputid === AVMConstants.NFTXFEROUTPUTID ||
    outputid === AVMConstants.NFTXFEROUTPUTID_CODECONE
  ) {
    return new NFTTransferOutput(...args)
  }
  throw new OutputIdError(
    "Error - SelectOutputClass: unknown outputid " + outputid
  )
}

export class TransferableOutput extends StandardTransferableOutput {
  protected _typeName = "TransferableOutput"
  protected _typeID = undefined

  //serialize is inherited

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.output = SelectOutputClass(fields["output"]["_typeID"])
    this.output.deserialize(fields["output"], encoding)
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.assetID = bintools.copyFrom(
      bytes,
      offset,
      offset + AVMConstants.ASSETIDLEN
    )
    offset += AVMConstants.ASSETIDLEN
    const outputid: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.output = SelectOutputClass(outputid)
    return this.output.fromBuffer(bytes, offset)
  }
}

export abstract class AmountOutput extends StandardAmountOutput {
  protected _typeName = "AmountOutput"
  protected _typeID = undefined

  //serialize and deserialize both are inherited

  /**
   *
   * @param assetID An assetID which is wrapped around the Buffer of the Output
   */
  makeTransferable(assetID: Buffer): TransferableOutput {
    return new TransferableOutput(assetID, this)
  }

  select(id: number, ...args: any[]): Output {
    return SelectOutputClass(id, ...args)
  }
}

export abstract class NFTOutput extends BaseNFTOutput {
  protected _typeName = "NFTOutput"
  protected _typeID = undefined

  //serialize and deserialize both are inherited

  /**
   *
   * @param assetID An assetID which is wrapped around the Buffer of the Output
   */
  makeTransferable(assetID: Buffer): TransferableOutput {
    return new TransferableOutput(assetID, this)
  }

  select(id: number, ...args: any[]): Output {
    return SelectOutputClass(id, ...args)
  }
}

/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
export class SECPTransferOutput extends AmountOutput {
  protected _typeName = "SECPTransferOutput"
  protected _codecID = AVMConstants.LATESTCODEC
  protected _typeID =
    this._codecID === 0
      ? AVMConstants.SECPXFEROUTPUTID
      : AVMConstants.SECPXFEROUTPUTID_CODECONE

  //serialize and deserialize both are inherited

  /**
   * Set the codecID
   *
   * @param codecID The codecID to set
   */
  setCodecID(codecID: number): void {
    if (codecID !== 0 && codecID !== 1) {
      /* istanbul ignore next */
      throw new CodecIdError(
        "Error - SECPTransferOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    }
    this._codecID = codecID
    this._typeID =
      this._codecID === 0
        ? AVMConstants.SECPXFEROUTPUTID
        : AVMConstants.SECPXFEROUTPUTID_CODECONE
  }

  /**
   * Returns the outputID for this output
   */
  getOutputID(): number {
    return this._typeID
  }

  create(...args: any[]): this {
    return new SECPTransferOutput(...args) as this
  }

  clone(): this {
    const newout: SECPTransferOutput = this.create()
    newout.fromBuffer(this.toBuffer())
    return newout as this
  }
}

/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
export class SECPMintOutput extends Output {
  protected _typeName = "SECPMintOutput"
  protected _codecID = AVMConstants.LATESTCODEC
  protected _typeID =
    this._codecID === 0
      ? AVMConstants.SECPMINTOUTPUTID
      : AVMConstants.SECPMINTOUTPUTID_CODECONE

  //serialize and deserialize both are inherited

  /**
   * Set the codecID
   *
   * @param codecID The codecID to set
   */
  setCodecID(codecID: number): void {
    if (codecID !== 0 && codecID !== 1) {
      /* istanbul ignore next */
      throw new CodecIdError(
        "Error - SECPMintOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    }
    this._codecID = codecID
    this._typeID =
      this._codecID === 0
        ? AVMConstants.SECPMINTOUTPUTID
        : AVMConstants.SECPMINTOUTPUTID_CODECONE
  }

  /**
   * Returns the outputID for this output
   */
  getOutputID(): number {
    return this._typeID
  }

  /**
   *
   * @param assetID An assetID which is wrapped around the Buffer of the Output
   */
  makeTransferable(assetID: Buffer): TransferableOutput {
    return new TransferableOutput(assetID, this)
  }

  create(...args: any[]): this {
    return new SECPMintOutput(...args) as this
  }

  clone(): this {
    const newout: SECPMintOutput = this.create()
    newout.fromBuffer(this.toBuffer())
    return newout as this
  }

  select(id: number, ...args: any[]): Output {
    return SelectOutputClass(id, ...args)
  }
}

/**
 * An [[Output]] class which specifies an Output that carries an NFT Mint and uses secp256k1 signature scheme.
 */
export class NFTMintOutput extends NFTOutput {
  protected _typeName = "NFTMintOutput"
  protected _codecID = AVMConstants.LATESTCODEC
  protected _typeID =
    this._codecID === 0
      ? AVMConstants.NFTMINTOUTPUTID
      : AVMConstants.NFTMINTOUTPUTID_CODECONE

  //serialize and deserialize both are inherited

  /**
   * Set the codecID
   *
   * @param codecID The codecID to set
   */
  setCodecID(codecID: number): void {
    if (codecID !== 0 && codecID !== 1) {
      /* istanbul ignore next */
      throw new CodecIdError(
        "Error - NFTMintOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    }
    this._codecID = codecID
    this._typeID =
      this._codecID === 0
        ? AVMConstants.NFTMINTOUTPUTID
        : AVMConstants.NFTMINTOUTPUTID_CODECONE
  }

  /**
   * Returns the outputID for this output
   */
  getOutputID(): number {
    return this._typeID
  }

  /**
   * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTMintOutput]] and returns the size of the output.
   */
  fromBuffer(utxobuff: Buffer, offset: number = 0): number {
    this.groupID = bintools.copyFrom(utxobuff, offset, offset + 4)
    offset += 4
    return super.fromBuffer(utxobuff, offset)
  }

  /**
   * Returns the buffer representing the [[NFTMintOutput]] instance.
   */
  toBuffer(): Buffer {
    let superbuff: Buffer = super.toBuffer()
    let bsize: number = this.groupID.length + superbuff.length
    let barr: Buffer[] = [this.groupID, superbuff]
    return Buffer.concat(barr, bsize)
  }

  create(...args: any[]): this {
    return new NFTMintOutput(...args) as this
  }

  clone(): this {
    const newout: NFTMintOutput = this.create()
    newout.fromBuffer(this.toBuffer())
    return newout as this
  }

  /**
   * An [[Output]] class which contains an NFT mint for an assetID.
   *
   * @param groupID A number specifies the group this NFT is issued to
   * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing  addresses
   * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
   * @param threshold A number representing the the threshold number of signers required to sign the transaction

   */
  constructor(
    groupID: number = undefined,
    addresses: Buffer[] = undefined,
    locktime: BN = undefined,
    threshold: number = undefined
  ) {
    super(addresses, locktime, threshold)
    if (typeof groupID !== "undefined") {
      this.groupID.writeUInt32BE(groupID, 0)
    }
  }
}

/**
 * An [[Output]] class which specifies an Output that carries an NFT and uses secp256k1 signature scheme.
 */
export class NFTTransferOutput extends NFTOutput {
  protected _typeName = "NFTTransferOutput"
  protected _codecID = AVMConstants.LATESTCODEC
  protected _typeID =
    this._codecID === 0
      ? AVMConstants.NFTXFEROUTPUTID
      : AVMConstants.NFTXFEROUTPUTID_CODECONE

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      payload: serialization.encoder(
        this.payload,
        encoding,
        "Buffer",
        "hex",
        this.payload.length
      )
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.payload = serialization.decoder(
      fields["payload"],
      encoding,
      "hex",
      "Buffer"
    )
    this.sizePayload = Buffer.alloc(4)
    this.sizePayload.writeUInt32BE(this.payload.length, 0)
  }

  protected sizePayload: Buffer = Buffer.alloc(4)
  protected payload: Buffer

  /**
   * Set the codecID
   *
   * @param codecID The codecID to set
   */
  setCodecID(codecID: number): void {
    if (codecID !== 0 && codecID !== 1) {
      /* istanbul ignore next */
      throw new CodecIdError(
        "Error - NFTTransferOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    }
    this._codecID = codecID
    this._typeID =
      this._codecID === 0
        ? AVMConstants.NFTXFEROUTPUTID
        : AVMConstants.NFTXFEROUTPUTID_CODECONE
  }

  /**
   * Returns the outputID for this output
   */
  getOutputID(): number {
    return this._typeID
  }

  /**
   * Returns the payload as a {@link https://github.com/feross/buffer|Buffer} with content only.
   */
  getPayload = (): Buffer => bintools.copyFrom(this.payload)

  /**
   * Returns the payload as a {@link https://github.com/feross/buffer|Buffer} with length of payload prepended.
   */
  getPayloadBuffer = (): Buffer =>
    Buffer.concat([
      bintools.copyFrom(this.sizePayload),
      bintools.copyFrom(this.payload)
    ])

  /**
   * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOutput]] and returns the size of the output.
   */
  fromBuffer(utxobuff: Buffer, offset: number = 0): number {
    this.groupID = bintools.copyFrom(utxobuff, offset, offset + 4)
    offset += 4
    this.sizePayload = bintools.copyFrom(utxobuff, offset, offset + 4)
    let psize: number = this.sizePayload.readUInt32BE(0)
    offset += 4
    this.payload = bintools.copyFrom(utxobuff, offset, offset + psize)
    offset = offset + psize
    return super.fromBuffer(utxobuff, offset)
  }

  /**
   * Returns the buffer representing the [[NFTTransferOutput]] instance.
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()
    const bsize: number =
      this.groupID.length +
      this.sizePayload.length +
      this.payload.length +
      superbuff.length
    this.sizePayload.writeUInt32BE(this.payload.length, 0)
    const barr: Buffer[] = [
      this.groupID,
      this.sizePayload,
      this.payload,
      superbuff
    ]
    return Buffer.concat(barr, bsize)
  }

  create(...args: any[]): this {
    return new NFTTransferOutput(...args) as this
  }

  clone(): this {
    const newout: NFTTransferOutput = this.create()
    newout.fromBuffer(this.toBuffer())
    return newout as this
  }

  /**
     * An [[Output]] class which contains an NFT on an assetID.
     *
     * @param groupID A number representing the amount in the output
     * @param payload A {@link https://github.com/feross/buffer|Buffer} of max length 1024
     * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the the threshold number of signers required to sign the transaction

     */
  constructor(
    groupID: number = undefined,
    payload: Buffer = undefined,
    addresses: Buffer[] = undefined,
    locktime: BN = undefined,
    threshold: number = undefined
  ) {
    super(addresses, locktime, threshold)
    if (typeof groupID !== "undefined" && typeof payload !== "undefined") {
      this.groupID.writeUInt32BE(groupID, 0)
      this.sizePayload.writeUInt32BE(payload.length, 0)
      this.payload = bintools.copyFrom(payload, 0, payload.length)
    }
  }
}
