/**
 * @packageDocumentation
 * @module API-AVM-Operations
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { AVMConstants } from "./constants"
import {
  NFTTransferOutput,
  SECPMintOutput,
  SECPTransferOutput
} from "./outputs"
import { NBytes } from "../../common/nbytes"
import { SigIdx } from "../../common/credentials"
import { OutputOwners } from "../../common/output"
import {
  Serializable,
  Serialization,
  SerializedEncoding,
  SerializedType
} from "../../utils/serialization"
import {
  InvalidOperationIdError,
  CodecIdError,
  ChecksumError,
  AddressError
} from "../../utils/errors"

const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()
const cb58: SerializedType = "cb58"
const buffer: SerializedType = "Buffer"
const hex: SerializedType = "hex"
const decimalString: SerializedType = "decimalString"

/**
 * Takes a buffer representing the output and returns the proper [[Operation]] instance.
 *
 * @param opid A number representing the operation ID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Operation]]-extended class.
 */
export const SelectOperationClass = (
  opid: number,
  ...args: any[]
): Operation => {
  if (
    opid === AVMConstants.SECPMINTOPID ||
    opid === AVMConstants.SECPMINTOPID_CODECONE
  ) {
    return new SECPMintOperation(...args)
  } else if (
    opid === AVMConstants.NFTMINTOPID ||
    opid === AVMConstants.NFTMINTOPID_CODECONE
  ) {
    return new NFTMintOperation(...args)
  } else if (
    opid === AVMConstants.NFTXFEROPID ||
    opid === AVMConstants.NFTXFEROPID_CODECONE
  ) {
    return new NFTTransferOperation(...args)
  }
  /* istanbul ignore next */
  throw new InvalidOperationIdError(
    `Error - SelectOperationClass: unknown opid ${opid}`
  )
}

/**
 * A class representing an operation. All operation types must extend on this class.
 */
export abstract class Operation extends Serializable {
  protected _typeName = "Operation"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      sigIdxs: this.sigIdxs.map((s: SigIdx): object => s.serialize(encoding))
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.sigIdxs = fields["sigIdxs"].map((s: object): SigIdx => {
      let sidx: SigIdx = new SigIdx()
      sidx.deserialize(s, encoding)
      return sidx
    })
    this.sigCount.writeUInt32BE(this.sigIdxs.length, 0)
  }

  protected sigCount: Buffer = Buffer.alloc(4)
  protected sigIdxs: SigIdx[] = [] // idxs of signers from utxo

  static comparator =
    (): ((a: Operation, b: Operation) => 1 | -1 | 0) =>
    (a: Operation, b: Operation): 1 | -1 | 0 => {
      const aoutid: Buffer = Buffer.alloc(4)
      aoutid.writeUInt32BE(a.getOperationID(), 0)
      const abuff: Buffer = a.toBuffer()

      const boutid: Buffer = Buffer.alloc(4)
      boutid.writeUInt32BE(b.getOperationID(), 0)
      const bbuff: Buffer = b.toBuffer()

      const asort: Buffer = Buffer.concat(
        [aoutid, abuff],
        aoutid.length + abuff.length
      )
      const bsort: Buffer = Buffer.concat(
        [boutid, bbuff],
        boutid.length + bbuff.length
      )
      return Buffer.compare(asort, bsort) as 1 | -1 | 0
    }

  abstract getOperationID(): number

  /**
   * Returns the array of [[SigIdx]] for this [[Operation]]
   */
  getSigIdxs = (): SigIdx[] => this.sigIdxs

  /**
   * Returns the credential ID.
   */
  abstract getCredentialID(): number

  /**
   * Creates and adds a [[SigIdx]] to the [[Operation]].
   *
   * @param addressIdx The index of the address to reference in the signatures
   * @param address The address of the source of the signature
   */
  addSignatureIdx = (addressIdx: number, address: Buffer) => {
    const sigidx: SigIdx = new SigIdx()
    const b: Buffer = Buffer.alloc(4)
    b.writeUInt32BE(addressIdx, 0)
    sigidx.fromBuffer(b)
    sigidx.setSource(address)
    this.sigIdxs.push(sigidx)
    this.sigCount.writeUInt32BE(this.sigIdxs.length, 0)
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.sigCount = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const sigCount: number = this.sigCount.readUInt32BE(0)
    this.sigIdxs = []
    for (let i: number = 0; i < sigCount; i++) {
      const sigidx: SigIdx = new SigIdx()
      const sigbuff: Buffer = bintools.copyFrom(bytes, offset, offset + 4)
      sigidx.fromBuffer(sigbuff)
      offset += 4
      this.sigIdxs.push(sigidx)
    }
    return offset
  }

  toBuffer(): Buffer {
    this.sigCount.writeUInt32BE(this.sigIdxs.length, 0)
    let bsize: number = this.sigCount.length
    const barr: Buffer[] = [this.sigCount]
    for (let i: number = 0; i < this.sigIdxs.length; i++) {
      const b: Buffer = this.sigIdxs[`${i}`].toBuffer()
      barr.push(b)
      bsize += b.length
    }
    return Buffer.concat(barr, bsize)
  }

  /**
   * Returns a base-58 string representing the [[NFTMintOperation]].
   */
  toString(): string {
    return bintools.bufferToB58(this.toBuffer())
  }
}

/**
 * A class which contains an [[Operation]] for transfers.
 *
 */
export class TransferableOperation extends Serializable {
  protected _typeName = "TransferableOperation"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      assetID: serialization.encoder(this.assetID, encoding, buffer, cb58, 32),
      utxoIDs: this.utxoIDs.map((u) => u.serialize(encoding)),
      operation: this.operation.serialize(encoding)
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.assetID = serialization.decoder(
      fields["assetID"],
      encoding,
      cb58,
      buffer,
      32
    )
    this.utxoIDs = fields["utxoIDs"].map((u: object) => {
      let utxoid: UTXOID = new UTXOID()
      utxoid.deserialize(u, encoding)
      return utxoid
    })
    this.operation = SelectOperationClass(fields["operation"]["_typeID"])
    this.operation.deserialize(fields["operation"], encoding)
  }

  protected assetID: Buffer = Buffer.alloc(32)
  protected utxoIDs: UTXOID[] = []
  protected operation: Operation

  /**
   * Returns a function used to sort an array of [[TransferableOperation]]s
   */
  static comparator = (): ((
    a: TransferableOperation,
    b: TransferableOperation
  ) => 1 | -1 | 0) => {
    return function (
      a: TransferableOperation,
      b: TransferableOperation
    ): 1 | -1 | 0 {
      return Buffer.compare(a.toBuffer(), b.toBuffer()) as 1 | -1 | 0
    }
  }
  /**
   * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
   */
  getAssetID = (): Buffer => this.assetID

  /**
   * Returns an array of UTXOIDs in this operation.
   */
  getUTXOIDs = (): UTXOID[] => this.utxoIDs

  /**
   * Returns the operation
   */
  getOperation = (): Operation => this.operation

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.assetID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    const numutxoIDs: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.utxoIDs = []
    for (let i: number = 0; i < numutxoIDs; i++) {
      const utxoid: UTXOID = new UTXOID()
      offset = utxoid.fromBuffer(bytes, offset)
      this.utxoIDs.push(utxoid)
    }
    const opid: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.operation = SelectOperationClass(opid)
    return this.operation.fromBuffer(bytes, offset)
  }

  toBuffer(): Buffer {
    const numutxoIDs = Buffer.alloc(4)
    numutxoIDs.writeUInt32BE(this.utxoIDs.length, 0)
    let bsize: number = this.assetID.length + numutxoIDs.length
    const barr: Buffer[] = [this.assetID, numutxoIDs]
    this.utxoIDs = this.utxoIDs.sort(UTXOID.comparator())
    for (let i: number = 0; i < this.utxoIDs.length; i++) {
      const b: Buffer = this.utxoIDs[`${i}`].toBuffer()
      barr.push(b)
      bsize += b.length
    }
    const opid: Buffer = Buffer.alloc(4)
    opid.writeUInt32BE(this.operation.getOperationID(), 0)
    barr.push(opid)
    bsize += opid.length
    const b: Buffer = this.operation.toBuffer()
    bsize += b.length
    barr.push(b)
    return Buffer.concat(barr, bsize)
  }

  constructor(
    assetID: Buffer = undefined,
    utxoids: UTXOID[] | string[] | Buffer[] = undefined,
    operation: Operation = undefined
  ) {
    super()
    if (
      typeof assetID !== "undefined" &&
      assetID.length === AVMConstants.ASSETIDLEN &&
      operation instanceof Operation &&
      typeof utxoids !== "undefined" &&
      Array.isArray(utxoids)
    ) {
      this.assetID = assetID
      this.operation = operation
      for (let i: number = 0; i < utxoids.length; i++) {
        const utxoid: UTXOID = new UTXOID()
        if (typeof utxoids[`${i}`] === "string") {
          utxoid.fromString(utxoids[`${i}`] as string)
        } else if (utxoids[`${i}`] instanceof Buffer) {
          utxoid.fromBuffer(utxoids[`${i}`] as Buffer)
        } else if (utxoids[`${i}`] instanceof UTXOID) {
          utxoid.fromString(utxoids[`${i}`].toString()) // clone
        }
        this.utxoIDs.push(utxoid)
      }
    }
  }
}

/**
 * An [[Operation]] class which specifies a SECP256k1 Mint Op.
 */
export class SECPMintOperation extends Operation {
  protected _typeName = "SECPMintOperation"
  protected _codecID = AVMConstants.LATESTCODEC
  protected _typeID =
    this._codecID === 0
      ? AVMConstants.SECPMINTOPID
      : AVMConstants.SECPMINTOPID_CODECONE

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      mintOutput: this.mintOutput.serialize(encoding),
      transferOutputs: this.transferOutput.serialize(encoding)
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.mintOutput = new SECPMintOutput()
    this.mintOutput.deserialize(fields["mintOutput"], encoding)
    this.transferOutput = new SECPTransferOutput()
    this.transferOutput.deserialize(fields["transferOutputs"], encoding)
  }

  protected mintOutput: SECPMintOutput = undefined
  protected transferOutput: SECPTransferOutput = undefined

  /**
   * Set the codecID
   *
   * @param codecID The codecID to set
   */
  setCodecID(codecID: number): void {
    if (codecID !== 0 && codecID !== 1) {
      /* istanbul ignore next */
      throw new CodecIdError(
        "Error - SECPMintOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    }
    this._codecID = codecID
    this._typeID =
      this._codecID === 0
        ? AVMConstants.SECPMINTOPID
        : AVMConstants.SECPMINTOPID_CODECONE
  }

  /**
   * Returns the operation ID.
   */
  getOperationID(): number {
    return this._typeID
  }

  /**
   * Returns the credential ID.
   */
  getCredentialID(): number {
    if (this._codecID === 0) {
      return AVMConstants.SECPCREDENTIAL
    } else if (this._codecID === 1) {
      return AVMConstants.SECPCREDENTIAL_CODECONE
    }
  }

  /**
   * Returns the [[SECPMintOutput]] to be produced by this operation.
   */
  getMintOutput(): SECPMintOutput {
    return this.mintOutput
  }

  /**
   * Returns [[SECPTransferOutput]] to be produced by this operation.
   */
  getTransferOutput(): SECPTransferOutput {
    return this.transferOutput
  }

  /**
   * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[SECPMintOperation]] and returns the updated offset.
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    this.mintOutput = new SECPMintOutput()
    offset = this.mintOutput.fromBuffer(bytes, offset)
    this.transferOutput = new SECPTransferOutput()
    offset = this.transferOutput.fromBuffer(bytes, offset)
    return offset
  }

  /**
   * Returns the buffer representing the [[SECPMintOperation]] instance.
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()
    const mintoutBuff: Buffer = this.mintOutput.toBuffer()
    const transferOutBuff: Buffer = this.transferOutput.toBuffer()
    const bsize: number =
      superbuff.length + mintoutBuff.length + transferOutBuff.length

    const barr: Buffer[] = [superbuff, mintoutBuff, transferOutBuff]

    return Buffer.concat(barr, bsize)
  }

  /**
   * An [[Operation]] class which mints new tokens on an assetID.
   *
   * @param mintOutput The [[SECPMintOutput]] that will be produced by this transaction.
   * @param transferOutput A [[SECPTransferOutput]] that will be produced from this minting operation.
   */
  constructor(
    mintOutput: SECPMintOutput = undefined,
    transferOutput: SECPTransferOutput = undefined
  ) {
    super()
    if (typeof mintOutput !== "undefined") {
      this.mintOutput = mintOutput
    }
    if (typeof transferOutput !== "undefined") {
      this.transferOutput = transferOutput
    }
  }
}

/**
 * An [[Operation]] class which specifies a NFT Mint Op.
 */
export class NFTMintOperation extends Operation {
  protected _typeName = "NFTMintOperation"
  protected _codecID = AVMConstants.LATESTCODEC
  protected _typeID =
    this._codecID === 0
      ? AVMConstants.NFTMINTOPID
      : AVMConstants.NFTMINTOPID_CODECONE

  serialize(encoding: SerializedEncoding = "hex"): object {
    const fields: object = super.serialize(encoding)
    return {
      ...fields,
      groupID: serialization.encoder(
        this.groupID,
        encoding,
        buffer,
        decimalString,
        4
      ),
      payload: serialization.encoder(this.payload, encoding, buffer, hex),
      outputOwners: this.outputOwners.map((o) => o.serialize(encoding))
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.groupID = serialization.decoder(
      fields["groupID"],
      encoding,
      decimalString,
      buffer,
      4
    )
    this.payload = serialization.decoder(
      fields["payload"],
      encoding,
      hex,
      buffer
    )
    // this.outputOwners = fields["outputOwners"].map((o: NFTMintOutput) => {
    //   let oo: NFTMintOutput = new NFTMintOutput()
    //   oo.deserialize(o, encoding)
    //   return oo
    // })
    this.outputOwners = fields["outputOwners"].map(
      (o: object): OutputOwners => {
        let oo: OutputOwners = new OutputOwners()
        oo.deserialize(o, encoding)
        return oo
      }
    )
  }

  protected groupID: Buffer = Buffer.alloc(4)
  protected payload: Buffer
  protected outputOwners: OutputOwners[] = []

  /**
   * Set the codecID
   *
   * @param codecID The codecID to set
   */
  setCodecID(codecID: number): void {
    if (codecID !== 0 && codecID !== 1) {
      /* istanbul ignore next */
      throw new CodecIdError(
        "Error - NFTMintOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    }
    this._codecID = codecID
    this._typeID =
      this._codecID === 0
        ? AVMConstants.NFTMINTOPID
        : AVMConstants.NFTMINTOPID_CODECONE
  }

  /**
   * Returns the operation ID.
   */
  getOperationID(): number {
    return this._typeID
  }

  /**
   * Returns the credential ID.
   */
  getCredentialID = (): number => {
    if (this._codecID === 0) {
      return AVMConstants.NFTCREDENTIAL
    } else if (this._codecID === 1) {
      return AVMConstants.NFTCREDENTIAL_CODECONE
    }
  }

  /**
   * Returns the payload.
   */
  getGroupID = (): Buffer => {
    return bintools.copyFrom(this.groupID, 0)
  }

  /**
   * Returns the payload.
   */
  getPayload = (): Buffer => {
    return bintools.copyFrom(this.payload, 0)
  }

  /**
   * Returns the payload's raw {@link https://github.com/feross/buffer|Buffer} with length prepended, for use with [[PayloadBase]]'s fromBuffer
   */
  getPayloadBuffer = (): Buffer => {
    let payloadlen: Buffer = Buffer.alloc(4)
    payloadlen.writeUInt32BE(this.payload.length, 0)
    return Buffer.concat([payloadlen, bintools.copyFrom(this.payload, 0)])
  }

  /**
   * Returns the outputOwners.
   */
  getOutputOwners = (): OutputOwners[] => {
    return this.outputOwners
  }

  /**
   * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTMintOperation]] and returns the updated offset.
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    this.groupID = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    let payloadLen: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.payload = bintools.copyFrom(bytes, offset, offset + payloadLen)
    offset += payloadLen
    let numoutputs: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.outputOwners = []
    for (let i: number = 0; i < numoutputs; i++) {
      let outputOwner: OutputOwners = new OutputOwners()
      offset = outputOwner.fromBuffer(bytes, offset)
      this.outputOwners.push(outputOwner)
    }
    return offset
  }

  /**
   * Returns the buffer representing the [[NFTMintOperation]] instance.
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()
    const payloadlen: Buffer = Buffer.alloc(4)
    payloadlen.writeUInt32BE(this.payload.length, 0)

    const outputownerslen: Buffer = Buffer.alloc(4)
    outputownerslen.writeUInt32BE(this.outputOwners.length, 0)

    let bsize: number =
      superbuff.length +
      this.groupID.length +
      payloadlen.length +
      this.payload.length +
      outputownerslen.length

    const barr: Buffer[] = [
      superbuff,
      this.groupID,
      payloadlen,
      this.payload,
      outputownerslen
    ]

    for (let i: number = 0; i < this.outputOwners.length; i++) {
      let b: Buffer = this.outputOwners[`${i}`].toBuffer()
      barr.push(b)
      bsize += b.length
    }

    return Buffer.concat(barr, bsize)
  }

  /**
   * Returns a base-58 string representing the [[NFTMintOperation]].
   */
  toString(): string {
    return bintools.bufferToB58(this.toBuffer())
  }

  /**
   * An [[Operation]] class which contains an NFT on an assetID.
   *
   * @param groupID The group to which to issue the NFT Output
   * @param payload A {@link https://github.com/feross/buffer|Buffer} of the NFT payload
   * @param outputOwners An array of outputOwners
   */
  constructor(
    groupID: number = undefined,
    payload: Buffer = undefined,
    outputOwners: OutputOwners[] = undefined
  ) {
    super()
    if (
      typeof groupID !== "undefined" &&
      typeof payload !== "undefined" &&
      outputOwners.length
    ) {
      this.groupID.writeUInt32BE(groupID ? groupID : 0, 0)
      this.payload = payload
      this.outputOwners = outputOwners
    }
  }
}

/**
 * A [[Operation]] class which specifies a NFT Transfer Op.
 */
export class NFTTransferOperation extends Operation {
  protected _typeName = "NFTTransferOperation"
  protected _codecID = AVMConstants.LATESTCODEC
  protected _typeID =
    this._codecID === 0
      ? AVMConstants.NFTXFEROPID
      : AVMConstants.NFTXFEROPID_CODECONE

  serialize(encoding: SerializedEncoding = "hex"): object {
    const fields: object = super.serialize(encoding)
    return {
      ...fields,
      output: this.output.serialize(encoding)
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.output = new NFTTransferOutput()
    this.output.deserialize(fields["output"], encoding)
  }

  protected output: NFTTransferOutput

  /**
   * Set the codecID
   *
   * @param codecID The codecID to set
   */
  setCodecID(codecID: number): void {
    if (codecID !== 0 && codecID !== 1) {
      /* istanbul ignore next */
      throw new CodecIdError(
        "Error - NFTTransferOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    }
    this._codecID = codecID
    this._typeID =
      this._codecID === 0
        ? AVMConstants.NFTXFEROPID
        : AVMConstants.NFTXFEROPID_CODECONE
  }

  /**
   * Returns the operation ID.
   */
  getOperationID(): number {
    return this._typeID
  }

  /**
   * Returns the credential ID.
   */
  getCredentialID(): number {
    if (this._codecID === 0) {
      return AVMConstants.NFTCREDENTIAL
    } else if (this._codecID === 1) {
      return AVMConstants.NFTCREDENTIAL_CODECONE
    }
  }

  getOutput = (): NFTTransferOutput => this.output

  /**
   * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOperation]] and returns the updated offset.
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    this.output = new NFTTransferOutput()
    return this.output.fromBuffer(bytes, offset)
  }

  /**
   * Returns the buffer representing the [[NFTTransferOperation]] instance.
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()
    const outbuff: Buffer = this.output.toBuffer()
    const bsize: number = superbuff.length + outbuff.length
    const barr: Buffer[] = [superbuff, outbuff]
    return Buffer.concat(barr, bsize)
  }

  /**
   * Returns a base-58 string representing the [[NFTTransferOperation]].
   */
  toString(): string {
    return bintools.bufferToB58(this.toBuffer())
  }

  /**
   * An [[Operation]] class which contains an NFT on an assetID.
   *
   * @param output An [[NFTTransferOutput]]
   */
  constructor(output: NFTTransferOutput = undefined) {
    super()
    if (typeof output !== "undefined") {
      this.output = output
    }
  }
}

/**
 * Class for representing a UTXOID used in [[TransferableOp]] types
 */
export class UTXOID extends NBytes {
  protected _typeName = "UTXOID"
  protected _typeID = undefined

  //serialize and deserialize both are inherited

  protected bytes = Buffer.alloc(36)
  protected bsize = 36

  /**
   * Returns a function used to sort an array of [[UTXOID]]s
   */
  static comparator =
    (): ((a: UTXOID, b: UTXOID) => 1 | -1 | 0) =>
    (a: UTXOID, b: UTXOID): 1 | -1 | 0 =>
      Buffer.compare(a.toBuffer(), b.toBuffer()) as 1 | -1 | 0

  /**
   * Returns a base-58 representation of the [[UTXOID]].
   */
  toString(): string {
    return bintools.cb58Encode(this.toBuffer())
  }

  /**
   * Takes a base-58 string containing an [[UTXOID]], parses it, populates the class, and returns the length of the UTXOID in bytes.
   *
   * @param bytes A base-58 string containing a raw [[UTXOID]]
   *
   * @returns The length of the raw [[UTXOID]]
   */
  fromString(utxoid: string): number {
    const utxoidbuff: Buffer = bintools.b58ToBuffer(utxoid)
    if (utxoidbuff.length === 40 && bintools.validateChecksum(utxoidbuff)) {
      const newbuff: Buffer = bintools.copyFrom(
        utxoidbuff,
        0,
        utxoidbuff.length - 4
      )
      if (newbuff.length === 36) {
        this.bytes = newbuff
      }
    } else if (utxoidbuff.length === 40) {
      throw new ChecksumError(
        "Error - UTXOID.fromString: invalid checksum on address"
      )
    } else if (utxoidbuff.length === 36) {
      this.bytes = utxoidbuff
    } else {
      /* istanbul ignore next */
      throw new AddressError("Error - UTXOID.fromString: invalid address")
    }
    return this.getSize()
  }

  clone(): this {
    const newbase: UTXOID = new UTXOID()
    newbase.fromBuffer(this.toBuffer())
    return newbase as this
  }

  create(...args: any[]): this {
    return new UTXOID() as this
  }

  /**
   * Class for representing a UTXOID used in [[TransferableOp]] types
   */
  constructor() {
    super()
  }
}
