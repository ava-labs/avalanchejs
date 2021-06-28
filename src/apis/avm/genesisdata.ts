/**
 * @packageDocumentation
 * @module API-AVM-GenesisData
 */
import { Buffer } from 'buffer/'
import BinTools from '../../utils/bintools'
import { AVMConstants } from './constants'
import { TransferableOutput } from './outputs'
import { TransferableInput } from './inputs'
import { InitialStates } from './initialstates'
import { BaseTx } from './basetx'
import { DefaultNetworkID } from '../../utils/constants'
import { Serializable, Serialization, SerializedEncoding } from '../../utils/serialization'
import { StandardBaseTx } from 'src/common'
import { CreateAssetTx } from './createassettx'
import { GenesisAsset } from '.'

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

export class GenesisData extends Serializable {
  protected _typeName = "GenesisData"
  protected _codecID = AVMConstants.LATESTCODEC
  // protected _typeID: number = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      "networkID": serialization.encoder(this.networkID, encoding, "Buffer", "decimalString"),
    }
  }

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.networkID = serialization.decoder(fields["networkID"], encoding, "decimalString", "Buffer", 4)
    // this.name = serialization.decoder(fields["name"], encoding, "utf8", "utf8")
    // this.symbol = serialization.decoder(fields["symbol"], encoding, "utf8", "utf8")
    // this.denomination = serialization.decoder(fields["denomination"], encoding, "decimalString", "Buffer", 1)
    // this.initialstate = new InitialStates()
    // this.initialstate.deserialize(fields["initialstate"], encoding)
  }

  protected networkID: Buffer = Buffer.alloc(4)
  protected genesisAssets: GenesisAsset[]

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[GenesisData]].
   */
  toBuffer(): Buffer {
    // * codec_id: 00 00
    // * num_assets: 00 00 00 01 
    // * asset[0]
    //   * asset_alias_len: 00 06 
    //   * asset_alias: 61 73 73 65 74 31 
    //   * network_id: 00 00 00 00 
    //   * blockchain_id: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 
    //   * output_len: 00 00 00 00 
    //   * input_len: 00 00 00 00 
    //   * memo_len: 00 00 00 1b 
    //   * memo: 66 72 6f 6d 20 73 6e 6f 77 66 6c 61 6b 65 20 74 6f 20 61 76 61 6c 61 6e 63 68 65 
    //   * asset_name_len: 00 0f 
    //   * asset_name: 6d 79 46 69 78 65 64 43 61 70 41 73 73 65 74 
    //   * symbol_len: 00 04 
    //   * symbol: 4d 46 43 41 
    //   * denomination: 07 
    //   * num_initial_states: 00 00 00 01 
    //   * initial_state[0]
    //     * fx: 00 00 00 00 
    //     * num_outs: 00 00 00 01 
    //     * out[0]
    //       * type id: 00 00 00 07 
    //       * amount: 00 00 00 00 00 01 86 a0 
    //       * locktime: 00 00 00 00 00 00 00 00 
    //       * threshold: 00 00 00 01 
    //       * num addrs: 00 00 00 01 
    //       * addr[0]: 3c b7 d3 84 2e 8c ee 6a 0e bd 09 f1 fe 88 4f 68 61 e1 b2 9c
    // const superbuff: Buffer = super.toBuffer()
    // codec id
    const codecbuffSize: Buffer = Buffer.alloc(2)
    codecbuffSize.writeUInt16BE(this._codecID, 0)

    // num assets
    const numAssetsbuffSize: Buffer = Buffer.alloc(4)
    numAssetsbuffSize.writeUInt32BE(this.genesisAssets.length, 0)

    let bsize: number = codecbuffSize.length + numAssetsbuffSize.length
    let barr: Buffer[] = [codecbuffSize, numAssetsbuffSize]

    this.genesisAssets.forEach((genesisAsset: GenesisAsset) => {
      const b: Buffer = genesisAsset.toBuffer(serialization.bufferToType(this.networkID, "BN").toNumber())
      // console.log(b.toString('hex'))

      bsize += b.length
      barr.push(b)
    })
    return Buffer.concat(barr, bsize)
  }

  /**
  * Class representing a GenesisData
  *
  * @param networkid Optional networkid
  * @param genesisAssets Optional GenesisAsset[]
  */
  constructor(networkID: number = 0, genesisAssets: GenesisAsset[] = [], encoding: SerializedEncoding = "hex") {
    super()
    this.networkID.writeUInt32BE(networkID, 0)
    this.genesisAssets = genesisAssets
  }
}