/**
 * @packageDocumentation
 * @module API-AVM-GenesisAsset
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { InitialStates } from "./initialstates"
import { DefaultNetworkID } from "../../utils/constants"
import {
  Serialization,
  SerializedEncoding,
  SerializedType
} from "../../utils/serialization"
import { CreateAssetTx } from "./createassettx"
import BN from "bn.js"

/**
 * @ignore
 */
const serialization: Serialization = Serialization.getInstance()
const bintools: BinTools = BinTools.getInstance()
const utf8: SerializedType = "utf8"
const buffer: SerializedType = "Buffer"
const decimalString: SerializedType = "decimalString"

export class GenesisAsset extends CreateAssetTx {
  protected _typeName = "GenesisAsset"
  protected _codecID = undefined
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    const fields: object = super.serialize(encoding)
    delete fields["blockchainID"]
    delete fields["outs"]
    delete fields["ins"]
    return {
      ...fields,
      assetAlias: serialization.encoder(this.assetAlias, encoding, utf8, utf8),
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
    fields["blockchainID"] = Buffer.alloc(32, 16).toString("hex")
    fields["outs"] = []
    fields["ins"] = []
    super.deserialize(fields, encoding)
    this.assetAlias = serialization.decoder(
      fields["assetAlias"],
      encoding,
      utf8,
      utf8
    )
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

  protected assetAlias: string = ""

  /**
   * Returns the string representation of the assetAlias
   */
  getAssetAlias = (): string => this.assetAlias

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[GenesisAsset]], parses it, populates the class, and returns the length of the [[GenesisAsset]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[GenesisAsset]]
   *
   * @returns The length of the raw [[GenesisAsset]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    const assetAliasSize: number = bintools
      .copyFrom(bytes, offset, offset + 2)
      .readUInt16BE(0)
    offset += 2
    this.assetAlias = bintools
      .copyFrom(bytes, offset, offset + assetAliasSize)
      .toString("utf8")
    offset += assetAliasSize
    offset += super.fromBuffer(bytes, offset)
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[GenesisAsset]].
   */
  toBuffer(networkID: number = DefaultNetworkID): Buffer {
    // asset alias
    const assetAlias: string = this.getAssetAlias()
    const assetAliasbuffSize: Buffer = Buffer.alloc(2)
    assetAliasbuffSize.writeUInt16BE(assetAlias.length, 0)
    let bsize: number = assetAliasbuffSize.length
    let barr: Buffer[] = [assetAliasbuffSize]
    const assetAliasbuff: Buffer = Buffer.alloc(assetAlias.length)
    assetAliasbuff.write(assetAlias, 0, assetAlias.length, utf8)
    bsize += assetAliasbuff.length
    barr.push(assetAliasbuff)

    const networkIDBuff: Buffer = Buffer.alloc(4)
    networkIDBuff.writeUInt32BE(new BN(networkID).toNumber(), 0)
    bsize += networkIDBuff.length
    barr.push(networkIDBuff)

    // Blockchain ID
    bsize += 32
    barr.push(Buffer.alloc(32))

    // num Outputs
    bsize += 4
    barr.push(Buffer.alloc(4))

    // num Inputs
    bsize += 4
    barr.push(Buffer.alloc(4))

    // memo
    const memo: Buffer = this.getMemo()
    const memobuffSize: Buffer = Buffer.alloc(4)
    memobuffSize.writeUInt32BE(memo.length, 0)
    bsize += memobuffSize.length
    barr.push(memobuffSize)

    bsize += memo.length
    barr.push(memo)

    // asset name
    const name: string = this.getName()
    const namebuffSize: Buffer = Buffer.alloc(2)
    namebuffSize.writeUInt16BE(name.length, 0)
    bsize += namebuffSize.length
    barr.push(namebuffSize)
    const namebuff: Buffer = Buffer.alloc(name.length)
    namebuff.write(name, 0, name.length, utf8)
    bsize += namebuff.length
    barr.push(namebuff)

    // symbol
    const symbol: string = this.getSymbol()
    const symbolbuffSize: Buffer = Buffer.alloc(2)
    symbolbuffSize.writeUInt16BE(symbol.length, 0)
    bsize += symbolbuffSize.length
    barr.push(symbolbuffSize)

    const symbolbuff: Buffer = Buffer.alloc(symbol.length)
    symbolbuff.write(symbol, 0, symbol.length, utf8)
    bsize += symbolbuff.length
    barr.push(symbolbuff)

    // denomination
    const denomination: number = this.getDenomination()
    const denominationbuffSize: Buffer = Buffer.alloc(1)
    denominationbuffSize.writeUInt8(denomination, 0)
    bsize += denominationbuffSize.length
    barr.push(denominationbuffSize)

    bsize += this.initialState.toBuffer().length
    barr.push(this.initialState.toBuffer())
    return Buffer.concat(barr, bsize)
  }

  /**
   * Class representing a GenesisAsset
   *
   * @param assetAlias Optional String for the asset alias
   * @param name Optional String for the descriptive name of the asset
   * @param symbol Optional String for the ticker symbol of the asset
   * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVAX = 10^9 $nAVAX
   * @param initialState Optional [[InitialStates]] that represent the intial state of a created asset
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   */
  constructor(
    assetAlias: string = undefined,
    name: string = undefined,
    symbol: string = undefined,
    denomination: number = undefined,
    initialState: InitialStates = undefined,
    memo: Buffer = undefined
  ) {
    super(DefaultNetworkID, Buffer.alloc(32), [], [], memo)
    if (
      typeof assetAlias === "string" &&
      typeof name === "string" &&
      typeof symbol === "string" &&
      typeof denomination === "number" &&
      denomination >= 0 &&
      denomination <= 32 &&
      typeof initialState !== "undefined"
    ) {
      this.assetAlias = assetAlias
      this.name = name
      this.symbol = symbol
      this.denomination.writeUInt8(denomination, 0)
      this.initialState = initialState
    }
  }
}
