/**
 * @packageDocumentation
 * @module Utils-BinTools
 */
import BN from "bn.js"
import { Buffer } from "buffer/"
import createHash from "create-hash"
import * as bech32 from "bech32"
import { Base58 } from "./base58"
import { Bech32Error, ChecksumError, HexError } from "../utils/errors"
import { utils } from "ethers"

/**
 * A class containing tools useful in interacting with binary data cross-platform using
 * nodejs & javascript.
 *
 * This class should never be instantiated directly. Instead,
 * invoke the "BinTools.getInstance()" static * function to grab the singleton
 * instance of the tools.
 *
 * Everything in this library uses the [Buffer](https://github.com/feross/buffer) class.
 *
 * ```js
 * const bintools: BinTools = BinTools.getInstance();
 * const b58str:  = bintools.bufferToB58(Buffer.from("Wubalubadubdub!"));
 * ```
 */
export default class BinTools {
  private static instance: BinTools

  private constructor() {
    this.b58 = Base58.getInstance()
  }

  private b58: Base58

  /**
   * Retrieves the BinTools singleton.
   *
   * @returns An instance of BinTools.
   */
  static getInstance(): BinTools {
    if (!BinTools.instance) {
      BinTools.instance = new BinTools()
    }
    return BinTools.instance
  }

  /**
   * Returns true if base64, otherwise false.
   *
   * @param str the [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) to verify is Base64.
   *
   * @returns a [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean).
   */
  isBase64(str: string): boolean {
    if (str === "" || str.trim() === "") {
      return false
    }
    try {
      const b64: Buffer = Buffer.from(str, "base64")
      return b64.toString("base64") === str
    } catch (err) {
      return false
    }
  }

  /**
   * Returns true if cb58, otherwise false.
   *
   * @param cb58 the [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) to verify is cb58.
   *
   * @returns a [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean).
   */
  isCB58(cb58: string): boolean {
    return this.isBase58(cb58)
  }

  /**
   * Returns true if base58, otherwise false.
   *
   * @param base58 the [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) to verify is base58.
   *
   * @returns a [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean).
   */
  isBase58(base58: string): boolean {
    if (base58 === "" || base58.trim() === "") {
      return false
    }
    try {
      return this.b58.encode(this.b58.decode(base58)) === base58
    } catch (err) {
      return false
    }
  }

  /**
   * Returns true if hexidecimal, otherwise false.
   *
   * @param hex the [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) to verify is hexidecimal.
   *
   * @returns a [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean).
   */
  isHex(hex: string): boolean {
    if (hex === "" || hex.trim() === "") {
      return false
    }
    if (
      (hex.startsWith("0x") && hex.slice(2).match(/^[0-9A-Fa-f]/g)) ||
      hex.match(/^[0-9A-Fa-f]/g)
    ) {
      return true
    } else {
      return false
    }
  }

  /**
   * Returns true if decimal, otherwise false.
   *
   * @param str the [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) to verify is hexidecimal.
   *
   * @returns a [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean).
   */
  isDecimal(str: string): boolean {
    if (str === "" || str.trim() === "") {
      return false
    }
    try {
      return new BN(str, 10).toString(10) === str.trim()
    } catch (err) {
      return false
    }
  }

  /**
   * Returns true if meets requirements to parse as an address as Bech32 on X-Chain or P-Chain, otherwise false.
   *
   * @param address The [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) to verify is address.
   *
   * @returns a [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean).
   */
  isPrimaryBechAddress = (address: string): boolean => {
    const parts: string[] = address.trim().split("-")
    if (parts.length !== 2) {
      return false
    }
    try {
      bech32.bech32.fromWords(bech32.bech32.decode(parts[1]).words)
    } catch (err) {
      return false
    }
    return true
  }

  /**
   * Produces a [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) from a [Buffer](https://github.com/feross/buffer). ONLY USED IN TRANSACTION FORMATTING, ASSUMED LENGTH IS PREPENDED.
   *
   * @param buff The [Buffer](https://github.com/feross/buffer) to convert to a [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   *
   * @returns a [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   */
  bufferToString = (buff: Buffer): string =>
    this.copyFrom(buff, 2).toString("utf8")

  /**
   * Produces a [Buffer](https://github.com/feross/buffer) from a [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String). ONLY USED IN TRANSACTION FORMATTING, LENGTH IS PREPENDED.
   *
   * @param str The [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) to convert to a [Buffer](https://github.com/feross/buffer)
   *
   * @returns a [Buffer](https://github.com/feross/buffer).
   */
  stringToBuffer = (str: string): Buffer => {
    const buff: Buffer = Buffer.alloc(2 + str.length)
    buff.writeUInt16BE(str.length, 0)
    buff.write(str, 2, str.length, "utf8")
    return buff
  }

  /**
   * Makes a copy (no reference) of a [Buffer](https://github.com/feross/buffer) over provided indices.
   *
   * @param buff The [Buffer](https://github.com/feross/buffer) to copy.
   * @param start The index to start the copy as a [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number). Defaults to 0.
   * @param end The index to end the copy as a [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number). Defaults to `undefined`.
   *
   * @returns a [Buffer](https://github.com/feross/buffer).
   */
  copyFrom = (
    buff: Buffer,
    start: number = 0,
    end: number = undefined
  ): Buffer => {
    if (end === undefined) {
      end = buff.length
    }
    return Buffer.from(Uint8Array.prototype.slice.call(buff.slice(start, end)))
  }

  /**
   * Takes a [Buffer](https://github.com/feross/buffer) and returns a base-58 [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   *
   * @param buff The [Buffer](https://github.com/feross/buffer) to convert to base-58.
   *
   * @returns a [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   */
  bufferToB58 = (buff: Buffer): string => this.b58.encode(buff)

  /**
   * Takes a base-58 [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) and returns a [Buffer](https://github.com/feross/buffer).
   *
   * @param b58str The base-58 [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) to convert to a [Buffer](https://github.com/feross/buffer).
   *
   * @returns a [Buffer](https://github.com/feross/buffer).
   */
  b58ToBuffer = (b58str: string): Buffer => this.b58.decode(b58str)

  /**
   * Takes a [Buffer](https://github.com/feross/buffer) and returns an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer).
   *
   * @param buff The [Buffer](https://github.com/feross/buffer) to convert to an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer).
   *
   * @returns a [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer).
   */
  fromBufferToArrayBuffer = (buff: Buffer): ArrayBuffer => {
    const ab: ArrayBuffer = new ArrayBuffer(buff.length)
    const view: Uint8Array = new Uint8Array(ab)
    for (let i: number = 0; i < buff.length; ++i) {
      view[`${i}`] = buff[`${i}`]
    }
    return view
  }

  /**
   * Takes an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) and converts it to a [Buffer](https://github.com/feross/buffer).
   *
   * @param ab The [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) to convert to a [Buffer](https://github.com/feross/buffer).
   *
   * @returns a [Buffer](https://github.com/feross/buffer).
   */
  fromArrayBufferToBuffer = (ab: ArrayBuffer): Buffer => {
    const buf: Buffer = Buffer.alloc(ab.byteLength)
    for (let i: number = 0; i < ab.byteLength; ++i) {
      buf[`${i}`] = ab[`${i}`]
    }
    return buf
  }

  /**
   * Takes a [Buffer](https://github.com/feross/buffer) and converts it to a [BN](https://github.com/indutny/bn.js).
   *
   * @param buff The [Buffer](https://github.com/feross/buffer) to convert to a [BN](https://github.com/indutny/bn.js).
   *
   * @returns a [BN](https://github.com/indutny/bn.js).
   */
  fromBufferToBN = (buff: Buffer): BN => {
    if (typeof buff === "undefined") {
      return undefined
    }
    return new BN(buff.toString("hex"), 16, "be")
  }
  /**
   * Takes a [BN](https://github.com/indutny/bn.js) and converts it to a [Buffer](https://github.com/feross/buffer).
   *
   * @param bn The [BN](https://github.com/indutny/bn.js) to convert to a [Buffer](https://github.com/feross/buffer).
   * @param length Optional. The zero-padded length of the [Buffer](https://github.com/feross/buffer) as a [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number).
   *
   * @returns a [Buffer](https://github.com/feross/buffer).
   */
  fromBNToBuffer = (bn: BN, length?: number): Buffer => {
    if (typeof bn === "undefined") {
      return undefined
    }
    const newArr: number[] = bn.toArray("be")
    /**
     * CKC: Still unsure why bn.toArray with a "be" and a length do not work right. Bug?
     * TODO - address this comment.
     */
    if (length) {
      // bn toArray with the length parameter doesn't work correctly, need this.
      const x: number = length - newArr.length
      for (let i: number = 0; i < x; i++) {
        newArr.unshift(0)
      }
    }
    return Buffer.from(newArr)
  }

  /**
   * Takes a [Buffer](https://github.com/feross/buffer) and adds a checksum, returning a [Buffer](https://github.com/feross/buffer) with the 4-byte checksum appended.
   *
   * @param buff The [Buffer](https://github.com/feross/buffer) to append a checksum.
   *
   * @returns a [Buffer](https://github.com/feross/buffer).
   */
  addChecksum = (buff: Buffer): Buffer => {
    const hashslice: Buffer = Buffer.from(
      createHash("sha256").update(buff).digest().slice(28)
    )
    return Buffer.concat([buff, hashslice])
  }

  /**
   * Takes a [Buffer](https://github.com/feross/buffer) with an appended 4-byte checksum
   * and returns true if the checksum is valid, otherwise false.
   *
   * @param buff The [Buffer](https://github.com/feross/buffer) to validate the checksum.
   *
   * @returns a [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean).
   */
  validateChecksum = (buff: Buffer): boolean => {
    const checkslice: Buffer = buff.slice(buff.length - 4)
    const hashslice: Buffer = Buffer.from(
      createHash("sha256")
        .update(buff.slice(0, buff.length - 4))
        .digest()
        .slice(28)
    )
    return checkslice.toString("hex") === hashslice.toString("hex")
  }

  /**
   * Takes a [Buffer](https://github.com/feross/buffer) and returns a base-58 [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) with
   * checksum as per the cb58 standard.
   *
   * @param bytes A [Buffer](https://github.com/feross/buffer) to serialize
   *
   * @returns A serialized base-58 [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) of the [Buffer](https://github.com/feross/buffer).
   */
  cb58Encode = (bytes: Buffer): string => {
    const x: Buffer = this.addChecksum(bytes)
    return this.bufferToB58(x)
  }

  /**
   * Takes a cb58 serialized [Buffer](https://github.com/feross/buffer) or base-58 [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
   * and returns a [Buffer](https://github.com/feross/buffer) of the original data. Throws on error.
   *
   * @param bytes A cb58 serialized [Buffer](https://github.com/feross/buffer) or base-58 [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   *
   * @returns a [Buffer](https://github.com/feross/buffer).
   */
  cb58Decode = (bytes: Buffer | string): Buffer => {
    if (typeof bytes === "string") {
      bytes = this.b58ToBuffer(bytes)
    }
    if (this.validateChecksum(bytes)) {
      return this.copyFrom(bytes, 0, bytes.length - 4)
    }
    throw new ChecksumError("Error - BinTools.cb58Decode: invalid checksum")
  }

  /**
   * Takes a human-readable-part, chainID and address bytes and returns the address as a [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   *
   * @param hrp The human-readable-part of the address as a [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   * @param chainID as a [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   * @param bytes as a [Buffer](https://github.com/feross/buffer).
   *
   * @returns a [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   */
  addressToString = (hrp: string, chainID: string, bytes: Buffer): string =>
    `${chainID}-${bech32.bech32.encode(hrp, bech32.bech32.toWords(bytes))}`

  /**
   * Takes a human-readable-part, chainID and address bytes and returns the address as a [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   *
   * @param address as a [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   * @param hrp Optional. The human-readable-part of the address as a [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   *
   * @returns a [Buffer](https://github.com/feross/buffer).
   */
  stringToAddress = (address: string, hrp?: string): Buffer => {
    if (address.substring(0, 2) === "0x") {
      // ETH-style address
      if (utils.isAddress(address)) {
        return Buffer.from(address.substring(2), "hex")
      } else {
        throw new HexError("Error - Invalid address")
      }
    }
    // Bech32 addresses
    const parts: string[] = address.trim().split("-")

    if (parts.length < 2) {
      throw new Bech32Error("Error - Valid address should include -")
    }

    if (parts[0].length < 1) {
      throw new Bech32Error("Error - Valid address must have prefix before -")
    }

    const split: number = parts[1].lastIndexOf("1")
    if (split < 0) {
      throw new Bech32Error("Error - Valid address must include separator (1)")
    }

    const humanReadablePart: string = parts[1].slice(0, split)
    if (humanReadablePart.length < 1) {
      throw new Bech32Error("Error - HRP should be at least 1 character")
    }

    if (
      humanReadablePart !== "avax" &&
      humanReadablePart !== "fuji" &&
      humanReadablePart != "local" &&
      humanReadablePart != hrp
    ) {
      throw new Bech32Error("Error - Invalid HRP")
    }

    return Buffer.from(
      bech32.bech32.fromWords(bech32.bech32.decode(parts[1]).words)
    )
  }

  /**
   * Takes an address and returns its [Buffer](https://github.com/feross/buffer)
   * representation if valid. A more strict version of `stringToAddress`.
   *
   * @param address A [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) representation of the address.
   * @param blockchainID A cb58 encoded [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) representation of the blockchainID.
   * @param alias A chainID alias, if any, that the address can also parse from.
   * @param addressLength VMs can use any addressing scheme that they like, so this is the appropriate number of address bytes. Default 20.
   *
   * @returns A [Buffer](https://github.com/feross/buffer) for the address if valid,
   * undefined if not valid.
   */
  parseAddress = (
    address: string,
    blockchainID: string,
    alias: string = undefined,
    addressLength: number = 20
  ): Buffer => {
    const abc: string[] = address.split("-")
    if (
      abc.length === 2 &&
      ((alias && abc[0] === alias) || (blockchainID && abc[0] === blockchainID))
    ) {
      const addressBuff: Buffer = this.stringToAddress(address)
      if (
        (addressLength && addressBuff.length === addressLength) ||
        !addressLength
      ) {
        return addressBuff
      }
    }
    return undefined
  }
}
