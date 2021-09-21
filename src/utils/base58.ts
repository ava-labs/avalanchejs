/**
 * @packageDocumentation
 * @module Utils-Base58
 */
import BN from "bn.js"
import { Buffer } from "buffer/"
import { Base58Error } from "../utils/errors"

/**
 * A Base58 class that uses the cross-platform Buffer module. Built so that Typescript
 * will accept the code.
 *
 * ```js
 * let b58:Base58 = new Base58();
 * let str:string = b58.encode(somebuffer);
 * let buff:Buffer = b58.decode(somestring);
 * ```
 */
export class Base58 {
  private static instance: Base58

  private constructor() {}

  /**
   * Retrieves the Base58 singleton.
   */
  static getInstance(): Base58 {
    if (!Base58.instance) {
      Base58.instance = new Base58()
    }
    return Base58.instance
  }

  protected b58alphabet: string =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

  protected alphabetIdx0 = "1"

  protected b58 = [
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 255, 255, 255, 255, 255, 255,
    255, 9, 10, 11, 12, 13, 14, 15, 16, 255, 17, 18, 19, 20, 21, 255, 22, 23,
    24, 25, 26, 27, 28, 29, 30, 31, 32, 255, 255, 255, 255, 255, 255, 33, 34,
    35, 36, 37, 38, 39, 40, 41, 42, 43, 255, 44, 45, 46, 47, 48, 49, 50, 51, 52,
    53, 54, 55, 56, 57, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255
  ]

  protected big58Radix: BN = new BN(58)

  protected bigZero: BN = new BN(0)

  /**
   * Encodes a {@link https://github.com/feross/buffer|Buffer} as a base-58 string
   *
   * @param buff A {@link https://github.com/feross/buffer|Buffer} to encode
   *
   * @returns A base-58 string.
   */
  encode = (buff: Buffer): string => {
    let x: BN = new BN(buff.toString("hex"), "hex", "be")
    let answer: string = "" // = Buffer.alloc(buff.length*136/100, 0);
    while (x.cmp(this.bigZero) > 0) {
      const mod: BN = x.mod(this.big58Radix)
      x = x.div(this.big58Radix)
      answer += this.b58alphabet[mod.toNumber()]
    }

    for (let i: number = 0; i < buff.length; i++) {
      if (buff.readUInt8(i) !== 0) {
        break
      }
      answer += this.alphabetIdx0
    }
    return answer.split("").reverse().join("")
  }

  /**
   * Decodes a base-58 into a {@link https://github.com/feross/buffer|Buffer}
   *
   * @param b A base-58 string to decode
   *
   * @returns A {@link https://github.com/feross/buffer|Buffer} from the decoded string.
   */
  decode = (b: string): Buffer => {
    const answer: BN = new BN(0)
    const j: BN = new BN(1)

    for (let i: number = b.length - 1; i >= 0; i--) {
      const tmp: number = this.b58[b.charCodeAt(i)]
      if (tmp === 255) {
        throw new Base58Error(
          "Error - Base58.decode: not a valid base58 string"
        )
      }
      const scratch: BN = new BN(tmp)
      scratch.imul(j)
      answer.iadd(scratch)
      j.imul(this.big58Radix)
    }

    /* we need to make sure the prefaced 0's are put back to be even in this string */
    let anshex = answer.toString("hex")
    anshex = anshex.length % 2 ? `0${anshex}` : anshex

    /**
     * We need to replace all zeros that were removed during our conversation process.
     * This ensures the buffer returns is the appropriate length.
     */
    const tmpval: Buffer = Buffer.from(anshex, "hex")
    let numZeros: number
    for (numZeros = 0; numZeros < b.length; numZeros++) {
      if (b[`${numZeros}`] !== this.alphabetIdx0) {
        break
      }
    }
    const xlen: number = numZeros + tmpval.length
    const result: Buffer = Buffer.alloc(xlen, 0)
    tmpval.copy(result, numZeros)

    return result
  }
}
