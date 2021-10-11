/**
 * @packageDocumentation
 * @module API-AVM-MinterSet
 */

import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import {
  Serializable,
  Serialization,
  SerializedEncoding,
  SerializedType
} from "../../utils/serialization"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()
const decimalString: SerializedType = "decimalString"
const cb58: SerializedType = "cb58"
const num: SerializedType = "number"
const buffer: SerializedType = "Buffer"

/**
 * Class for representing a threshold and set of minting addresses in Avalanche.
 *
 * @typeparam MinterSet including a threshold and array of addresses
 */
export class MinterSet extends Serializable {
  protected _typeName = "MinterSet"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    const fields: object = super.serialize(encoding)
    return {
      ...fields,
      threshold: serialization.encoder(
        this.threshold,
        encoding,
        num,
        decimalString,
        4
      ),
      minters: this.minters.map((m) =>
        serialization.encoder(m, encoding, buffer, cb58, 20)
      )
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.threshold = serialization.decoder(
      fields["threshold"],
      encoding,
      decimalString,
      num,
      4
    )
    this.minters = fields["minters"].map((m: string) =>
      serialization.decoder(m, encoding, cb58, buffer, 20)
    )
  }

  protected threshold: number
  protected minters: Buffer[] = []

  /**
   * Returns the threshold.
   */
  getThreshold = (): number => {
    return this.threshold
  }

  /**
   * Returns the minters.
   */
  getMinters = (): Buffer[] => {
    return this.minters
  }

  protected _cleanAddresses = (addresses: string[] | Buffer[]): Buffer[] => {
    let addrs: Buffer[] = []
    for (let i: number = 0; i < addresses.length; i++) {
      if (typeof addresses[`${i}`] === "string") {
        addrs.push(bintools.stringToAddress(addresses[`${i}`] as string))
      } else if (addresses[`${i}`] instanceof Buffer) {
        addrs.push(addresses[`${i}`] as Buffer)
      }
    }
    return addrs
  }

  /**
   *
   * @param threshold The number of signatures required to mint more of an asset by signing a minting transaction
   * @param minters Array of addresss which are authorized to sign a minting transaction
   */
  constructor(threshold: number = 1, minters: string[] | Buffer[] = []) {
    super()
    this.threshold = threshold
    this.minters = this._cleanAddresses(minters)
  }
}
