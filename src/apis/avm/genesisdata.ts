/**
 * @packageDocumentation
 * @module API-AVM-GenesisData
 */
import { Buffer } from 'buffer/'
import { AVMConstants } from './constants'
import { Serializable, Serialization, SerializedEncoding } from '../../utils/serialization'
import { GenesisAsset } from '.'

/**
 * @ignore
 */
const serialization: Serialization = Serialization.getInstance()

export class GenesisData extends Serializable {
  protected _typeName = "GenesisData"
  protected _codecID = AVMConstants.LATESTCODEC
  // protected _typeID: number = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      "genesisAssets": this.genesisAssets.map((genesisAsset: GenesisAsset) => genesisAsset.serialize(encoding))
    }
  }

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
  }

  protected genesisAssets: GenesisAsset[]

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
  * Class representing a GenesisData
  *
  * @param genesisAssets Optional GenesisAsset[]
  */
  constructor(genesisAssets: GenesisAsset[] = [], encoding: SerializedEncoding = "hex") {
    super()
    this.genesisAssets = genesisAssets
  }
}