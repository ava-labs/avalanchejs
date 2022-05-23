/**
 * @packageDocumentation
 * @module API-AVM-Vertex
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { AVMConstants } from "./constants"
import { DefaultNetworkID } from "../../utils/constants"
import { UnsignedTx } from "./tx"
import { Serializable } from "../../utils/serialization"
import { CodecIdError } from "../../utils/errors"
import { Address } from "../../common"
import BN from "bn.js"
import { BaseTx } from "."

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

/**
 * Class representing a Vertex
 */
export class Vertex extends Serializable {
  protected _typeName = "Vertex"
  protected _codecID = AVMConstants.LATESTCODEC
  // serialize is inherited
  // deserialize is inherited
  protected chainID: Buffer = Buffer.alloc(32)
  protected height: Buffer = Buffer.alloc(8)
  protected epoch: Buffer = Buffer.alloc(4)
  protected numParentIDs: Buffer = Buffer.alloc(4)
  protected parentIDs: Buffer[] = []
  protected numTxs: Buffer = Buffer.alloc(4)
  protected txs: BaseTx[] = []
  protected numRestrictions: Buffer = Buffer.alloc(4)
  protected restrictions: Buffer[] = []

  /**
   * Returns the ChainID as a number
   */
  getChainID(): number {
    return this.chainID.readUInt32BE(0)
  }

  /**
   * Returns the height as a {@link https://github.com/indutny/bn.js/|BN}.
   */
  getHeight(): BN {
    return bintools.fromBufferToBN(this.height)
  }

  /**
   * Returns the epoch as a number.
   */
  getEpoch(): number {
    return this.epoch.readUInt32BE(0)
  }

  /**
   * @returns An array of Buffers
   */
  getParentIDs(): Buffer[] {
    return this.parentIDs
  }

  /**
   * Returns array of UnsignedTxs.
   */
  getTxs(): BaseTx[] {
    return this.txs
  }

  /**
   * @returns An array of Buffers
   */
  getRestrictions(): Buffer[] {
    return this.restrictions
  }

  /**
   * Set the codecID
   *
   * @param codecID The codecID to set
   */
  setCodecID(codecID: number): void {
    if (codecID !== 0 && codecID !== 1) {
      /* istanbul ignore next */
      throw new CodecIdError(
        "Error - BaseTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    }
    this._codecID = codecID
    this._typeID =
      this._codecID === 0 ? AVMConstants.VERTEX : AVMConstants.VERTEX_CODECONE
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[Vertex]], parses it, populates the class, and returns the length of the Vertex in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[Vertex]]
   *
   * @returns The length of the raw [[Vertex]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset += 2
    this.chainID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    this.height = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8
    this.epoch = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    this.numParentIDs = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const parentIDsCount: number = this.numParentIDs.readUInt32BE(0)
    for (let i: number = 0; i < parentIDsCount; i++) {
      const parentID: Buffer = bintools.copyFrom(bytes, offset, offset + 32)
      offset += 32
      this.parentIDs.push(parentID)
    }

    this.numTxs = bintools.copyFrom(bytes, offset, offset + 4)
    const txsCount: number = this.numTxs.readUInt32BE(0)
    offset += 8
    // TODO - why do we have these 4 mystery bytes?
    // first int is tx-size
    // second int is ?
    for (let i: number = 0; i < txsCount; i++) {
      const unsignedTx: UnsignedTx = new UnsignedTx()
      offset += unsignedTx.fromBuffer(bintools.copyFrom(bytes, offset))
      this.txs.push(unsignedTx.getTransaction())
    }

    this.numRestrictions = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const restrictionsCount: number = this.numRestrictions.readUInt32BE(0)
    for (let i: number = 0; i < restrictionsCount; i++) {
      const tx: Buffer = bintools.copyFrom(bytes, offset, offset + 32)
      offset += 32
      this.restrictions.push(tx)
    }
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[Vertex]].
   */
  toBuffer(): Buffer {
    const codec: number = this.getCodecID()
    const codecBuf: Buffer = Buffer.alloc(2)
    codecBuf.writeUInt16BE(codec, 0)
    let barr: Buffer[] = [
      codecBuf,
      this.chainID,
      this.height,
      this.epoch,
      this.numParentIDs
    ]
    this.parentIDs.forEach((parentID: Buffer): void => {
      barr.push(parentID)
    })

    const txs: BaseTx[] = this.getTxs()
    const numTxs: Buffer = Buffer.alloc(4)
    numTxs.writeUInt32BE(txs.length, 0)
    barr.push(numTxs)

    let size: number = 0
    const txSize: Buffer = Buffer.alloc(4)
    txs.forEach((tx: BaseTx): void => {
      const b: Buffer = tx.toBuffer()
      size += b.byteLength
    })
    txSize.writeUInt32BE(size, 0)
    barr.push(txSize)

    const mysteryBytes: Buffer = Buffer.from("00000000", "hex")
    barr.push(mysteryBytes)
    txs.forEach((tx: BaseTx): void => {
      const b: Buffer = tx.toBuffer()
      barr.push(b)
    })

    // barr.push(tx.toBuffer())
    // this.txs.length
    return Buffer.concat(barr)
  }

  clone(): this {
    let vertex: Vertex = new Vertex()
    vertex.fromBuffer(this.toBuffer())
    return vertex as this
  }
  /**
   * Class representing a Vertex which is a container for AVM Transactions.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param chainID Optional chainID, default Buffer.alloc(32, 16)
   */
  constructor(
    networkID: number = DefaultNetworkID,
    chainID: Buffer = Buffer.alloc(32),
    height: Buffer = Buffer.alloc(8),
    epoch: Buffer = Buffer.alloc(4),
    parentIDs: Address[] = [],
    txs: Buffer = Buffer.alloc(4),
    numRestrictions: Buffer = Buffer.alloc(4),
    restrictions: Address[] = []
  ) {
    super()
  }
}
