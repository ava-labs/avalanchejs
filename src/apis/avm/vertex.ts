/**
 * @packageDocumentation
 * @module API-AVM-Vertex
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { AVMConstants } from "./constants"
import { Tx, UnsignedTx } from "./tx"
import { Serializable, CodecIdError, DefaultNetworkID } from "../../utils"
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
  protected networkID: number
  protected blockchainID: Buffer
  protected height: BN
  protected epoch: number
  protected parentIDs: Buffer[]
  protected numParentIDs: number
  protected txs: Tx[]
  protected numTxs: number
  protected restrictions: Buffer[]
  protected numRestrictions: number

  /**
   * Returns the NetworkID as a number
   */
  getNetworkID(): number {
    return this.networkID
  }
  /**
   * Returns the BlockchainID as a CB58 string
   */
  getBlockchainID(): string {
    return bintools.cb58Encode(this.blockchainID)
  }

  /**
   * Returns the Height as a {@link https://github.com/indutny/bn.js/|BN}.
   */
  getHeight(): BN {
    return this.height
  }

  /**
   * Returns the Epoch as a number.
   */
  getEpoch(): number {
    return this.epoch
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
  getTxs(): Tx[] {
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
        "Error - Vertex.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
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
    this.blockchainID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32

    const h: Buffer = bintools.copyFrom(bytes, offset, offset + 8)
    this.height = bintools.fromBufferToBN(h)
    offset += 8

    const e: Buffer = bintools.copyFrom(bytes, offset, offset + 4)
    this.epoch = e.readInt32BE(0)
    offset += 4

    const nPIDs: Buffer = bintools.copyFrom(bytes, offset, offset + 4)
    this.numParentIDs = nPIDs.readInt32BE(0)
    offset += 4

    for (let i: number = 0; i < this.numParentIDs; i++) {
      const parentID: Buffer = bintools.copyFrom(bytes, offset, offset + 32)
      offset += 32
      this.parentIDs.push(parentID)
    }

    const nTxs: Buffer = bintools.copyFrom(bytes, offset, offset + 4)
    this.numTxs = nTxs.readInt32BE(0)
    // account for tx-size bytes
    offset += 8

    for (let i: number = 0; i < this.numTxs; i++) {
      const tx: Tx = new Tx()
      offset += tx.fromBuffer(bintools.copyFrom(bytes, offset))
      this.txs.push(tx)
    }

    if (bytes.byteLength > offset && bytes.byteLength - offset > 4) {
      const nRs: Buffer = bintools.copyFrom(bytes, offset, offset + 4)
      this.numRestrictions = nRs.readInt32BE(0)
      offset += 4
      for (let i: number = 0; i < this.numRestrictions; i++) {
        const tx: Buffer = bintools.copyFrom(bytes, offset, offset + 32)
        offset += 32
        this.restrictions.push(tx)
      }
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

    const epochBuf: Buffer = Buffer.alloc(4)
    epochBuf.writeInt32BE(this.epoch, 0)

    const numParentIDsBuf: Buffer = Buffer.alloc(4)
    numParentIDsBuf.writeInt32BE(this.numParentIDs, 0)
    let barr: Buffer[] = [
      codecBuf,
      this.blockchainID,
      bintools.fromBNToBuffer(this.height, 8),
      epochBuf,
      numParentIDsBuf
    ]
    this.parentIDs.forEach((parentID: Buffer): void => {
      barr.push(parentID)
    })

    const txs: Tx[] = this.getTxs()
    const numTxs: Buffer = Buffer.alloc(4)
    numTxs.writeUInt32BE(txs.length, 0)
    barr.push(numTxs)

    let size: number = 0
    const txSize: Buffer = Buffer.alloc(4)
    txs.forEach((tx: Tx): void => {
      const b: Buffer = tx.toBuffer()
      size += b.byteLength
    })
    txSize.writeUInt32BE(size, 0)
    barr.push(txSize)

    txs.forEach((tx: Tx): void => {
      const b: Buffer = tx.toBuffer()
      barr.push(b)
    })

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
   * @param networkID Optional, [[DefaultNetworkID]]
   * @param blockchainID Optional, default "2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM"
   * @param height Optional, default new BN(0)
   * @param epoch Optional, default new BN(0)
   * @param parentIDs Optional, default []
   * @param txs Optional, default []
   * @param restrictions Optional, default []
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: string = "2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM",
    height: BN = new BN(0),
    epoch: number = 0,
    parentIDs: Buffer[] = [],
    txs: Tx[] = [],
    restrictions: Buffer[] = []
  ) {
    super()
    this.networkID = networkID
    this.blockchainID = bintools.cb58Decode(blockchainID)
    this.height = height
    this.epoch = epoch
    this.parentIDs = parentIDs
    this.numParentIDs = parentIDs.length
    this.txs = txs
    this.numTxs = txs.length
    this.restrictions = restrictions
    this.numRestrictions = restrictions.length
  }
}
