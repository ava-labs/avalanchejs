/**
 * @packageDocumentation
 * @module API-AVM-GenesisData
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import {
  Serializable,
  Serialization,
  SerializedEncoding
} from "../../utils/serialization"
import { AVMConstants } from "./constants"
import { GenesisAsset } from "."
import { DefaultNetworkID, SerializedType } from "../../utils"

/**
 * @ignore
 */
const serialization: Serialization = Serialization.getInstance()
const bintools: BinTools = BinTools.getInstance()
const decimalString: SerializedType = "decimalString"
const buffer: SerializedType = "Buffer"

export class GenesisData extends Serializable {
  protected _typeName = "GenesisData"
  protected _codecID = AVMConstants.LATESTCODEC

  // TODO - setCodecID?
  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      genesisAssets: this.genesisAssets.map((genesisAsset: GenesisAsset) =>
        genesisAsset.serialize(encoding)
      ),
      networkID: serialization.encoder(
        this.networkID,
        encoding,
        buffer,
        decimalString
      )
    }
  }

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.genesisAssets = fields["genesisAssets"].map(
      (genesisAsset: GenesisAsset): GenesisAsset => {
        let g: GenesisAsset = new GenesisAsset()
        g.deserialize(genesisAsset, encoding)
        return g
      }
    )
    this.networkID = serialization.decoder(
      fields["networkID"],
      encoding,
      decimalString,
      buffer,
      4
    )
  }

  protected genesisAssets: GenesisAsset[]
  protected networkID: Buffer = Buffer.alloc(4)

  /**
   * Returns the GenesisAssets[]
   */
  getGenesisAssets = (): GenesisAsset[] => this.genesisAssets

  /**
   * Returns the NetworkID as a number
   */
  getNetworkID = (): number => this.networkID.readUInt32BE(0)

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
    this._codecID = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0)
    offset += 2
    const numGenesisAssets = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const assetCount: number = numGenesisAssets.readUInt32BE(0)
    this.genesisAssets = []
    for (let i: number = 0; i < assetCount; i++) {
      const genesisAsset: GenesisAsset = new GenesisAsset()
      offset = genesisAsset.fromBuffer(bytes, offset)
      this.genesisAssets.push(genesisAsset)
      if (i === 0) {
        this.networkID.writeUInt32BE(genesisAsset.getNetworkID(), 0)
      }
    }
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[GenesisData]].
   */
  toBuffer(): Buffer {
    // codec id
    const codecbuffSize: Buffer = Buffer.alloc(2)
    codecbuffSize.writeUInt16BE(this._codecID, 0)

    // num assets
    const numAssetsbuffSize: Buffer = Buffer.alloc(4)
    numAssetsbuffSize.writeUInt32BE(this.genesisAssets.length, 0)

    let bsize: number = codecbuffSize.length + numAssetsbuffSize.length
    let barr: Buffer[] = [codecbuffSize, numAssetsbuffSize]

    this.genesisAssets.forEach((genesisAsset: GenesisAsset): void => {
      const b: Buffer = genesisAsset.toBuffer(this.getNetworkID())
      bsize += b.length
      barr.push(b)
    })
    return Buffer.concat(barr, bsize)
  }

  /**
   * Class representing AVM GenesisData
   *
   * @param genesisAssets Optional GenesisAsset[]
   * @param networkID Optional DefaultNetworkID
   */
  constructor(
    genesisAssets: GenesisAsset[] = [],
    networkID: number = DefaultNetworkID
  ) {
    super()
    this.genesisAssets = genesisAssets
    this.networkID.writeUInt32BE(networkID, 0)
  }
}
