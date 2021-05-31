/**
 * @packageDocumentation
 * @module Utils-Mnemonic
 */

import { Buffer } from 'buffer/'
import { Wordlist } from 'ethers'
import { InvalidEntropy } from './errors'
const bip39: any = require('bip39')
const randomBytes: any = require("randombytes")

/**
 * Implementation of Mnemonic. Mnemonic code for generating deterministic keys.
 *
 */
export class BIP39 {
  private static instance: BIP39
  private constructor() { }
  protected wordlists: string[] = bip39.wordlists

  /**
   * Retrieves the Mnemonic singleton.
   */
  static getInstance(): BIP39 {
    if (!BIP39.instance) {
      BIP39.instance = new BIP39()
    }
    return BIP39.instance
  }

  /**
   * Return wordlists
   *
   * @param language a string specifying the language
   *
   * @returns A [[Wordlist]] object or array of strings
   */
  getWordlists(language?: string): string[] | Wordlist {
    if (language !== undefined) {
      return this.wordlists[language]
    } else {
      return this.wordlists
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
  mnemonicToSeedSync(mnemonic: string, password: string): Buffer {
    return bip39.mnemonicToSeedSync(mnemonic, password)
  }

  /**
   * Asynchronously takes mnemonic and password and returns Promise<{@link https://github.com/feross/buffer|Buffer}>
   *
   * @param mnemonic the mnemonic as a string
   * @param password the password as a string
   *
   * @returns A {@link https://github.com/feross/buffer|Buffer}
   */
  mnemonicToSeed(mnemonic: string, password: string): Buffer {
    return bip39.mnemonicToSeed(mnemonic, password)
  }

  /**
   * Takes mnemonic and wordlist and returns buffer
   *
   * @param mnemonic the mnemonic as a string
   * @param wordlist Optional the wordlist as an array of strings
   *
   * @returns A string
   */
  mnemonicToEntropy(
    mnemonic: string,
    wordlist?: string[]
  ): string {
    return bip39.mnemonicToEntropy(mnemonic, wordlist)
  }

  /**
   * Takes mnemonic and wordlist and returns buffer
   *
   * @param entropy the entropy as a {@link https://github.com/feross/buffer|Buffer} or as a string
   * @param wordlist Optional, the wordlist as an array of strings
   *
   * @returns A string
   */
  entropyToMnemonic(
    entropy: Buffer | string,
    wordlist?: string[]
  ): string {
    return bip39.entropyToMnemonic(entropy, wordlist)
  }

  /**
   * Validates a mnemonic
   11*
   * @param mnemonic the mnemonic as a string
   * @param wordlist Optional the wordlist as an array of strings
   *
   * @returns A string
   */
  validateMnemonic(
    mnemonic: string,
    wordlist?: string[]
  ): string {
    return bip39.validateMnemonic(mnemonic, wordlist)
  }

  /**
   * Sets the default word list
   *
   * @param language the language as a string
   *
   * @returns A string
   */
  setDefaultWordlist(language: string): string {
    return bip39.setDefaultWordlist(language)
  }

  /**
   * Returns the language of the default word list
   * 
   * @returns A string
   */
  getDefaultWordlist(): string {
    return bip39.getDefaultWordlist()
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
    wordlist?: string[],
  ): string {
    strength = strength || 256
    if (strength % 32 !== 0) {
      throw new InvalidEntropy('Error - Invalid entropy')
    }
    rng = rng || randomBytes
    return bip39.generateMnemonic(strength, rng, wordlist)
  }
}