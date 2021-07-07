/**
* @packageDocumentation
* @module API-AVM-GenesisData
*/
import { Buffer } from "buffer/"
import { Serializable, Serialization, SerializedEncoding } from "../../utils/serialization"
import { AVMConstants } from "./constants"
import { GenesisAsset } from "."
import { DefaultNetworkID, SerializedType } from "../../utils"

/**
* @ignore
*/
const serialization: Serialization = Serialization.getInstance()
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
      genesisAssets: this.genesisAssets.map((genesisAsset: GenesisAsset) => genesisAsset.serialize(encoding)),
      networkID: serialization.encoder(this.networkID, encoding, buffer, decimalString),
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

  /**
  * Returns the GenesisAssets[]
  */
  getGenesisAssets = (): GenesisAsset[] => this.genesisAssets

  /**
  * Returns the NetworkID as a number
  */
  getNetworkID = (): number => this.networkID.readUInt32BE(0)

  // TODO fromBuffer

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
  constructor(genesisAssets: GenesisAsset[] = [], networkID: number = DefaultNetworkID) {
    super()
    this.genesisAssets = genesisAssets
    this.networkID.writeUInt32BE(networkID, 0)
  }
}