/**
 * @packageDocumentation
 * @module Common-NBytes
 */

import { Buffer } from "buffer/"
import BinTools from "../utils/bintools"
import {
  Serializable,
  Serialization,
  SerializedEncoding
} from "../utils/serialization"
import { BufferSizeError } from "../utils/errors"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Abstract class that implements basic functionality for managing a
 * {@link https://github.com/feross/buffer|Buffer} of an exact length.
 *
 * Create a class that extends this one and override bsize to make it validate for exactly
 * the correct length.
 */
export abstract class NBytes extends Serializable {
  protected _typeName = "NBytes"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      bsize: serialization.encoder(
        this.bsize,
        encoding,
        "number",
        "decimalString",
        4
      ),
      bytes: serialization.encoder(
        this.bytes,
        encoding,
        "Buffer",
        "hex",
        this.bsize
      )
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.bsize = serialization.decoder(
      fields["bsize"],
      encoding,
      "decimalString",
      "number",
      4
    )
    this.bytes = serialization.decoder(
      fields["bytes"],
      encoding,
      "hex",
      "Buffer",
      this.bsize
    )
  }

  protected bytes: Buffer
  protected bsize: number

  /**
   * Returns the length of the {@link https://github.com/feross/buffer|Buffer}.
   *
   * @returns The exact length requirement of this class
   */
  getSize = () => this.bsize

  /**
   * Takes a base-58 encoded string, verifies its length, and stores it.
   *
   * @returns The size of the {@link https://github.com/feross/buffer|Buffer}
   */
  fromString(b58str: string): number {
    try {
      this.fromBuffer(bintools.b58ToBuffer(b58str))
    } catch (e) {
      /* istanbul ignore next */
      const emsg: string = `Error - NBytes.fromString: ${e}`
      /* istanbul ignore next */
      throw new Error(emsg)
    }
    return this.bsize
  }

  /**
   * Takes a [[Buffer]], verifies its length, and stores it.
   *
   * @returns The size of the {@link https://github.com/feross/buffer|Buffer}
   */
  fromBuffer(buff: Buffer, offset: number = 0): number {
    try {
      if (buff.length - offset < this.bsize) {
        /* istanbul ignore next */
        throw new BufferSizeError(
          "Error - NBytes.fromBuffer: not enough space available in buffer."
        )
      }

      this.bytes = bintools.copyFrom(buff, offset, offset + this.bsize)
    } catch (e) {
      /* istanbul ignore next */
      const emsg: string = `Error - NBytes.fromBuffer: ${e}`
      /* istanbul ignore next */
      throw new Error(emsg)
    }
    return offset + this.bsize
  }

  /**
   * @returns A reference to the stored {@link https://github.com/feross/buffer|Buffer}
   */
  toBuffer(): Buffer {
    return this.bytes
  }

  /**
   * @returns A base-58 string of the stored {@link https://github.com/feross/buffer|Buffer}
   */
  toString(): string {
    return bintools.bufferToB58(this.toBuffer())
  }

  abstract clone(): this
  abstract create(...args: any[]): this
}
