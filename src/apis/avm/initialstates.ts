/**
 * @packageDocumentation
 * @module API-AVM-InitialStates
 */

import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { Output } from "../../common/output"
import { SelectOutputClass } from "./outputs"
import { AVMConstants } from "./constants"
import { Serializable, SerializedEncoding } from "../../utils/serialization"
/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

/**
 * Class for creating initial output states used in asset creation
 */
export class InitialStates extends Serializable {
  protected _typeName = "InitialStates"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    const fields: object = super.serialize(encoding)
    const flatfxs: object = {}
    for (let fxid in this.fxs) {
      flatfxs[`${fxid}`] = this.fxs[`${fxid}`].map((o: Output): object =>
        o.serialize(encoding)
      )
    }
    return {
      ...fields,
      fxs: flatfxs
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    const unflat: { [fxid: number]: Output[] } = {}
    for (let fxid in fields["fxs"]) {
      unflat[`${fxid}`] = fields["fxs"][`${fxid}`].map((o: object) => {
        const out: Output = SelectOutputClass(o["_typeID"])
        out.deserialize(o, encoding)
        return out
      })
    }
    this.fxs = unflat
  }

  protected fxs: { [fxid: number]: Output[] } = {}

  /**
   *
   * @param out The output state to add to the collection
   * @param fxid The FxID that will be used for this output, default AVMConstants.SECPFXID
   */
  addOutput(out: Output, fxid: number = AVMConstants.SECPFXID): void {
    if (!(fxid in this.fxs)) {
      this.fxs[`${fxid}`] = []
    }
    this.fxs[`${fxid}`].push(out)
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    const result: { [fxid: number]: Output[] } = []
    const klen: Buffer = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const klennum: number = klen.readUInt32BE(0)
    for (let i: number = 0; i < klennum; i++) {
      const fxidbuff: Buffer = bintools.copyFrom(bytes, offset, offset + 4)
      offset += 4
      const fxid: number = fxidbuff.readUInt32BE(0)
      result[`${fxid}`] = []
      const statelenbuff: Buffer = bintools.copyFrom(bytes, offset, offset + 4)
      offset += 4
      const statelen: number = statelenbuff.readUInt32BE(0)
      for (let j: number = 0; j < statelen; j++) {
        const outputid: number = bintools
          .copyFrom(bytes, offset, offset + 4)
          .readUInt32BE(0)
        offset += 4
        const out: Output = SelectOutputClass(outputid)
        offset = out.fromBuffer(bytes, offset)
        result[`${fxid}`].push(out)
      }
    }
    this.fxs = result
    return offset
  }

  toBuffer(): Buffer {
    const buff: Buffer[] = []
    const keys: number[] = Object.keys(this.fxs)
      .map((k: string): number => parseInt(k, 10))
      .sort()
    const klen: Buffer = Buffer.alloc(4)
    klen.writeUInt32BE(keys.length, 0)
    buff.push(klen)
    for (let i: number = 0; i < keys.length; i++) {
      const fxid: number = keys[`${i}`]
      const fxidbuff: Buffer = Buffer.alloc(4)
      fxidbuff.writeUInt32BE(fxid, 0)
      buff.push(fxidbuff)
      const initialState = this.fxs[`${fxid}`].sort(Output.comparator())
      const statelen: Buffer = Buffer.alloc(4)
      statelen.writeUInt32BE(initialState.length, 0)
      buff.push(statelen)
      for (let j: number = 0; j < initialState.length; j++) {
        const outputid: Buffer = Buffer.alloc(4)
        outputid.writeInt32BE(initialState[`${j}`].getOutputID(), 0)
        buff.push(outputid)
        buff.push(initialState[`${j}`].toBuffer())
      }
    }
    return Buffer.concat(buff)
  }
}
