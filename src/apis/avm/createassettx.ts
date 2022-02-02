/**
 * @packageDocumentation
 * @module API-AVM-CreateAssetTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { AVMConstants } from "./constants"
import { TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { InitialStates } from "./initialstates"
import { BaseTx } from "./basetx"
import { DefaultNetworkID } from "../../utils/constants"
import {
  Serialization,
  SerializedEncoding,
  SerializedType
} from "../../utils/serialization"
import { CodecIdError } from "../../utils/errors"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()
const utf8: SerializedType = "utf8"
const decimalString: SerializedType = "decimalString"
const buffer: SerializedType = "Buffer"

export class CreateAssetTx extends BaseTx {
  protected _typeName = "CreateAssetTx"
  protected _codecID = AVMConstants.LATESTCODEC
  protected _typeID =
    this._codecID === 0
      ? AVMConstants.CREATEASSETTX
      : AVMConstants.CREATEASSETTX_CODECONE

  serialize(encoding: SerializedEncoding = "hex"): object {
    const fields: object = super.serialize(encoding)
    return {
      ...fields,
      name: serialization.encoder(this.name, encoding, utf8, utf8),
      symbol: serialization.encoder(this.symbol, encoding, utf8, utf8),
      denomination: serialization.encoder(
        this.denomination,
        encoding,
        buffer,
        decimalString,
        1
      ),
      initialState: this.initialState.serialize(encoding)
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.name = serialization.decoder(fields["name"], encoding, utf8, utf8)
    this.symbol = serialization.decoder(fields["symbol"], encoding, utf8, utf8)
    this.denomination = serialization.decoder(
      fields["denomination"],
      encoding,
      decimalString,
      buffer,
      1
    )
    this.initialState = new InitialStates()
    this.initialState.deserialize(fields["initialState"], encoding)
  }

  protected name: string = ""
  protected symbol: string = ""
  protected denomination: Buffer = Buffer.alloc(1)
  protected initialState: InitialStates = new InitialStates()

  /**
   * Set the codecID
   *
   * @param codecID The codecID to set
   */
  setCodecID(codecID: number): void {
    if (codecID !== 0 && codecID !== 1) {
      /* istanbul ignore next */
      throw new CodecIdError(
        "Error - CreateAssetTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    }
    this._codecID = codecID
    this._typeID =
      this._codecID === 0
        ? AVMConstants.CREATEASSETTX
        : AVMConstants.CREATEASSETTX_CODECONE
  }

  /**
   * Returns the id of the [[CreateAssetTx]]
   */
  getTxType(): number {
    return this._typeID
  }

  /**
   * Returns the array of array of [[Output]]s for the initial state
   */
  getInitialStates(): InitialStates {
    return this.initialState
  }

  /**
   * Returns the string representation of the name
   */
  getName(): string {
    return this.name
  }

  /**
   * Returns the string representation of the symbol
   */
  getSymbol(): string {
    return this.symbol
  }

  /**
   * Returns the numeric representation of the denomination
   */
  getDenomination(): number {
    return this.denomination.readUInt8(0)
  }

  /**
   * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the denomination
   */
  getDenominationBuffer(): Buffer {
    return this.denomination
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[CreateAssetTx]], parses it, populates the class, and returns the length of the [[CreateAssetTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[CreateAssetTx]]
   *
   * @returns The length of the raw [[CreateAssetTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)

    const namesize: number = bintools
      .copyFrom(bytes, offset, offset + 2)
      .readUInt16BE(0)
    offset += 2
    this.name = bintools
      .copyFrom(bytes, offset, offset + namesize)
      .toString("utf8")
    offset += namesize

    const symsize: number = bintools
      .copyFrom(bytes, offset, offset + 2)
      .readUInt16BE(0)
    offset += 2
    this.symbol = bintools
      .copyFrom(bytes, offset, offset + symsize)
      .toString("utf8")
    offset += symsize

    this.denomination = bintools.copyFrom(bytes, offset, offset + 1)
    offset += 1

    const inits: InitialStates = new InitialStates()
    offset = inits.fromBuffer(bytes, offset)
    this.initialState = inits

    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateAssetTx]].
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()
    const initstatebuff: Buffer = this.initialState.toBuffer()

    const namebuff: Buffer = Buffer.alloc(this.name.length)
    namebuff.write(this.name, 0, this.name.length, utf8)
    const namesize: Buffer = Buffer.alloc(2)
    namesize.writeUInt16BE(this.name.length, 0)

    const symbuff: Buffer = Buffer.alloc(this.symbol.length)
    symbuff.write(this.symbol, 0, this.symbol.length, utf8)
    const symsize: Buffer = Buffer.alloc(2)
    symsize.writeUInt16BE(this.symbol.length, 0)

    const bsize: number =
      superbuff.length +
      namesize.length +
      namebuff.length +
      symsize.length +
      symbuff.length +
      this.denomination.length +
      initstatebuff.length
    const barr: Buffer[] = [
      superbuff,
      namesize,
      namebuff,
      symsize,
      symbuff,
      this.denomination,
      initstatebuff
    ]
    return Buffer.concat(barr, bsize)
  }

  clone(): this {
    let newbase: CreateAssetTx = new CreateAssetTx()
    newbase.fromBuffer(this.toBuffer())
    return newbase as this
  }

  create(...args: any[]): this {
    return new CreateAssetTx(...args) as this
  }

  /**
   * Class representing an unsigned Create Asset transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param name String for the descriptive name of the asset
   * @param symbol String for the ticker symbol of the asset
   * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVAX = 10^9 $nAVAX
   * @param initialState Optional [[InitialStates]] that represent the intial state of a created asset
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    name: string = undefined,
    symbol: string = undefined,
    denomination: number = undefined,
    initialState: InitialStates = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    if (
      typeof name === "string" &&
      typeof symbol === "string" &&
      typeof denomination === "number" &&
      denomination >= 0 &&
      denomination <= 32 &&
      typeof initialState !== "undefined"
    ) {
      this.initialState = initialState
      this.name = name
      this.symbol = symbol
      this.denomination.writeUInt8(denomination, 0)
    }
  }
}
