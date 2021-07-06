/**
 * @packageDocumentation
 * @module API-AVM-GenesisData
 */
import { Buffer } from "buffer/"
import { AVMConstants } from "./constants"
import { Serializable, Serialization, SerializedEncoding } from "../../utils/serialization"
import { GenesisAsset } from "."
import { DefaultNetworkID, SerializedType } from "src/utils"

/**
 * @ignore
 */
const serialization: Serialization = Serialization.getInstance()
const decimalString: SerializedType = "decimalString"
const utf8: SerializedType = "utf8"
const buffer: SerializedType = "Buffer"

export class GenesisData extends Serializable {
  protected _typeName = "GenesisData"
  protected _codecID = AVMConstants.LATESTCODEC
  // protected _typeID: number = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      genesisAssets: this.genesisAssets.map((genesisAsset: GenesisAsset) => genesisAsset.serialize(encoding)),
      networkID: serialization.encoder(this.networkID, encoding, buffer, decimalString),
      encoding: serialization.encoder(this.encoding, encoding, utf8, utf8),
    }
  }

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.genesisAssets = fields["genesisAssets"].map((genesisAsset: GenesisAsset): GenesisAsset => {
      let g: GenesisAsset = new GenesisAsset()
      g.deserialize(genesisAsset, encoding)
      return g
    })
    this.networkID = serialization.decoder(fields["networkID"], encoding, decimalString, buffer, 4)
  }

  protected genesisAssets: GenesisAsset[]
  protected networkID: Buffer = Buffer.alloc(4)
  protected encoding: string = ""

  /**
   * Returns the NetworkID as a number
   */
  getNetworkID = (): number => this.networkID.readUInt32BE(0)

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
      const b: Buffer = genesisAsset.toBuffer()

      bsize += b.length
      barr.push(b)
    })
    return Buffer.concat(barr, bsize)
  }

  /**
  * Class representing AVM GenesisData
  *
  * @param genesisAssets Optional GenesisAsset[]
  */
  constructor(genesisAssets: GenesisAsset[] = [], networkID: number = DefaultNetworkID, encoding: SerializedEncoding = "hex") {
    super()
    this.genesisAssets = genesisAssets
    this.networkID.writeUInt32BE(networkID, 0)
    this.encoding = encoding
  }
}