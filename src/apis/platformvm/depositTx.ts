/**
 * @packageDocumentation
 * @module API-PlatformVM-DepositTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import { ParseableOutput, TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { BaseTx } from "./basetx"
import { DefaultNetworkID } from "../../utils/constants"
import { Serialization, SerializedEncoding } from "../../utils/serialization"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Class representing an unsigned DepositTx transaction.
 */
export class DepositTx extends BaseTx {
  protected _typeName = "DepositTx"
  protected _typeID = PlatformVMConstants.DEPOSITTX

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      depositOfferID: serialization.encoder(
        this.depositOfferID,
        encoding,
        "Buffer",
        "cb58"
      ),
      depositDuration: serialization.encoder(
        this.depositDuration,
        encoding,
        "Buffer",
        "decimalString"
      ),
      rewardsOwner: this.rewardsOwner.serialize(encoding)
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.depositOfferID = serialization.decoder(
      fields["depositOfferID"],
      encoding,
      "cb58",
      "Buffer",
      32
    )
    this.depositDuration = serialization.decoder(
      fields["depositDuration"],
      encoding,
      "decimalString",
      "Buffer",
      4
    )
    this.rewardsOwner.deserialize(fields["rewardsOwner"], encoding)
  }

  // ID of active offer that will be used for this deposit
  protected depositOfferID: Buffer = Buffer.alloc(32)
  // duration of deposit (in 4 byte format)
  protected depositDuration: Buffer = Buffer.alloc(4)
  // Where to send staking rewards when done validating
  protected rewardsOwner: ParseableOutput = undefined

  /**
   * Returns the id of the [[RegisterNodeTx]]
   */
  getTxType(): number {
    return this._typeID
  }

  /**
   * Returns the depositOfferID
   */
  getDepositOfferID(): Buffer {
    return this.depositOfferID
  }

  /**
   * Returns the depositOfferID
   */
  getDepositDuration(): Buffer {
    return this.depositDuration
  }

  /**
   * Returns the depositOfferID
   */
  getRewardsOwner(): ParseableOutput {
    return this.rewardsOwner
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing a [[DepositTx]], parses it, populates the class, and returns the length of the [[DepositTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[DepositTx]]
   *
   * @returns The length of the raw [[DepositTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    this.depositOfferID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    this.depositDuration = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    this.rewardsOwner = new ParseableOutput()
    offset = this.rewardsOwner.fromBuffer(bytes, offset)

    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[DepositTx]].
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()

    let bsize: number =
      superbuff.length +
      this.depositOfferID.length +
      this.depositDuration.length
    const barr: Buffer[] = [
      superbuff,
      this.depositOfferID,
      this.depositDuration
    ]

    barr.push(this.rewardsOwner.toBuffer())
    bsize += this.rewardsOwner.toBuffer().length

    return Buffer.concat(barr, bsize)
  }

  clone(): this {
    const newDepositTx: DepositTx = new DepositTx()
    newDepositTx.fromBuffer(this.toBuffer())
    return newDepositTx as this
  }

  create(...args: any[]): this {
    return new DepositTx(...args) as this
  }

  /**
   * Class representing an unsigned RegisterNode transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param depositOfferID Optional ID of the deposit offer.
   * @param duration Optional Duration of depositing.
   * @param rewardsOwner Optional the owner of the rewards
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    depositOfferID: string | Buffer = undefined,
    depositDuration: number | Buffer = undefined,
    rewardsOwner: ParseableOutput = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    if (typeof depositOfferID != "undefined") {
      if (typeof depositOfferID === "string") {
        this.depositOfferID = bintools.cb58Decode(depositOfferID)
      } else {
        this.depositOfferID = depositOfferID
      }
    }
    if (typeof depositDuration != "undefined") {
      if (typeof depositDuration === "number") {
        this.depositDuration = Buffer.alloc(4)
        this.depositDuration.writeUInt32BE(depositDuration, 0)
      } else {
        this.depositDuration = depositDuration
      }
    }
    this.rewardsOwner = rewardsOwner
  }
}
