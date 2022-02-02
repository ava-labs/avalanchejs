/**
 * @packageDocumentation
 * @module API-PlatformVM-KeyChain
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { SECP256k1KeyChain, SECP256k1KeyPair } from "../../common/secp256k1"
import { Serialization, SerializedType } from "../../utils"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Class for representing a private and public keypair on the Platform Chain.
 */
export class KeyPair extends SECP256k1KeyPair {
  clone(): this {
    let newkp: KeyPair = new KeyPair(this.hrp, this.chainID)
    newkp.importKey(bintools.copyFrom(this.getPrivateKey()))
    return newkp as this
  }

  create(...args: any[]): this {
    if (args.length == 2) {
      return new KeyPair(args[0], args[1]) as this
    }
    return new KeyPair(this.hrp, this.chainID) as this
  }
}

/**
 * Class for representing a key chain in Avalanche.
 *
 * @typeparam KeyPair Class extending [[KeyPair]] which is used as the key in [[KeyChain]]
 */
export class KeyChain extends SECP256k1KeyChain<KeyPair> {
  hrp: string = ""
  chainID: string = ""

  /**
   * Makes a new key pair, returns the address.
   *
   * @returns The new key pair
   */
  makeKey = (): KeyPair => {
    let keypair: KeyPair = new KeyPair(this.hrp, this.chainID)
    this.addKey(keypair)
    return keypair
  }

  addKey = (newKey: KeyPair) => {
    newKey.setChainID(this.chainID)
    super.addKey(newKey)
  }

  /**
   * Given a private key, makes a new key pair, returns the address.
   *
   * @param privk A {@link https://github.com/feross/buffer|Buffer} or cb58 serialized string representing the private key
   *
   * @returns The new key pair
   */
  importKey = (privk: Buffer | string): KeyPair => {
    let keypair: KeyPair = new KeyPair(this.hrp, this.chainID)
    let pk: Buffer
    if (typeof privk === "string") {
      pk = bintools.cb58Decode(privk.split("-")[1])
    } else {
      pk = bintools.copyFrom(privk)
    }
    keypair.importKey(pk)
    if (!(keypair.getAddress().toString("hex") in this.keys)) {
      this.addKey(keypair)
    }
    return keypair
  }

  create(...args: any[]): this {
    if (args.length == 2) {
      return new KeyChain(args[0], args[1]) as this
    }
    return new KeyChain(this.hrp, this.chainID) as this
  }

  clone(): this {
    const newkc: KeyChain = new KeyChain(this.hrp, this.chainID)
    for (let k in this.keys) {
      newkc.addKey(this.keys[`${k}`].clone())
    }
    return newkc as this
  }

  union(kc: this): this {
    let newkc: KeyChain = kc.clone()
    for (let k in this.keys) {
      newkc.addKey(this.keys[`${k}`].clone())
    }
    return newkc as this
  }

  /**
   * Returns instance of KeyChain.
   */
  constructor(hrp: string, chainID: string) {
    super()
    this.hrp = hrp
    this.chainID = chainID
  }
}
