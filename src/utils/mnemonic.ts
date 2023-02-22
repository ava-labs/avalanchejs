/**
 * @packageDocumentation
 * @module Utils-Mnemonic
 */

import { Buffer } from "buffer/"
import { InvalidEntropy } from "./errors"
import {
  entropyToMnemonic,
  getDefaultWordlist,
  generateMnemonic,
  mnemonicToEntropy,
  mnemonicToSeed,
  mnemonicToSeedSync,
  setDefaultWordlist,
  validateMnemonic,
  wordlists as bip39_wordlists
} from "bip39"
import randomBytes from "randombytes"

/**
 * BIP39 Mnemonic code for generating deterministic keys.
 *
 */
export default class Mnemonic {
  private static instance: Mnemonic
  private constructor() {}
  protected wordlists = bip39_wordlists

  /**
   * Retrieves the Mnemonic singleton.
   */
  static getInstance(): Mnemonic {
    if (!Mnemonic.instance) {
      Mnemonic.instance = new Mnemonic()
    }
    return Mnemonic.instance
  }

  /**
   * Return wordlists
   *
   * @param language a string specifying the language
   *
   * @returns A [[Wordlist]] object or array of strings
   */
  getWordlists(language?: string): string[] {
    if (language !== undefined) {
      return this.wordlists[`${language}`]
    } else {
      return this.wordlists[`${getDefaultWordlist()}`]
    }
  }

  /**
   * Synchronously takes mnemonic and password and returns {@link https://github.com/feross/buffer|Buffer}
   *
   * @param mnemonic the mnemonic as a string
   * @param password the password as a string
   *
   * @returns A {@link https://github.com/feross/buffer|Buffer}
   */
  mnemonicToSeedSync(mnemonic: string, password: string = ""): Buffer {
    const seed = mnemonicToSeedSync(mnemonic, password)
    return Buffer.from(seed)
  }

  /**
   * Asynchronously takes mnemonic and password and returns Promise {@link https://github.com/feross/buffer|Buffer}
   *
   * @param mnemonic the mnemonic as a string
   * @param password the password as a string
   *
   * @returns A {@link https://github.com/feross/buffer|Buffer}
   */
  async mnemonicToSeed(
    mnemonic: string,
    password: string = ""
  ): Promise<Buffer> {
    const seed = await mnemonicToSeed(mnemonic, password)
    return Buffer.from(seed)
  }

  /**
   * Takes mnemonic and wordlist and returns buffer
   *
   * @param mnemonic the mnemonic as a string
   * @param wordlist Optional the wordlist as an array of strings
   *
   * @returns A string
   */
  mnemonicToEntropy(mnemonic: string, wordlist?: string[]): string {
    return mnemonicToEntropy(mnemonic, wordlist)
  }

  /**
   * Takes mnemonic and wordlist and returns buffer
   *
   * @param entropy the entropy as a {@link https://github.com/feross/buffer|Buffer} or as a string
   * @param wordlist Optional, the wordlist as an array of strings
   *
   * @returns A string
   */
  entropyToMnemonic(entropy: Buffer | string, wordlist?: string[]): string {
    const param: globalThis.Buffer | string =
      typeof entropy === "string" ? entropy : globalThis.Buffer.from(entropy)
    return entropyToMnemonic(param, wordlist)
  }

  /**
   * Validates a mnemonic
   11*
   * @param mnemonic the mnemonic as a string
   * @param wordlist Optional the wordlist as an array of strings
   *
   * @returns A string
   */
  validateMnemonic(mnemonic: string, wordlist?: string[]): boolean {
    return validateMnemonic(mnemonic, wordlist)
  }

  /**
   * Sets the default word list
   *
   * @param language the language as a string
   *
   */
  setDefaultWordlist(language: string): void {
    setDefaultWordlist(language)
  }

  /**
   * Returns the language of the default word list
   *
   * @returns A string
   */
  getDefaultWordlist(): string {
    return getDefaultWordlist()
  }

  /**
   * Generate a random mnemonic (uses crypto.randomBytes under the hood), defaults to 256-bits of entropy
   *
   * @param strength Optional the strength as a number
   * @param rng Optional the random number generator. Defaults to crypto.randomBytes
   * @param wordlist Optional
   *
   */
  generateMnemonic(
    strength?: number,
    rng?: (size: number) => Buffer,
    wordlist?: string[]
  ): string {
    strength = strength || 256
    if (strength % 32 !== 0) {
      throw new InvalidEntropy("Error - Invalid entropy")
    }
    var rnGT = rng
      ? (size: number) => {
          return globalThis.Buffer.from(rng(size))
        }
      : undefined
    rnGT = rnGT || randomBytes
    return generateMnemonic(strength, rnGT, wordlist)
  }
}
