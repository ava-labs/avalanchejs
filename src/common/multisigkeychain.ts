/**
 * @packageDocumentation
 * @module Common-MultiSigKeyChain
 */

import { Buffer } from "buffer/"
import { OutputOwners } from "."

import { Serialization, SerializedType } from "../utils"
import BinTools from "../utils/bintools"
import { StandardKeyChain, StandardKeyPair } from "./keychain"
import { SECP256k1KeyPair } from "./secp256k1"

const NotImplemented = new Error("not implemented in MultiSig KeyPair")
const TooManySignatures = new Error("too many signatures")

const serialization: Serialization = Serialization.getInstance()
const bintools: BinTools = BinTools.getInstance()
const MaxSignatures = 256

export type MultiSigAliasSet = Map<string, OutputOwners>

/**
 * Class for representing a generic multi signature key.
 */
export class MultiSigKeyPair extends StandardKeyPair {
  // The keychain required for address generation
  protected keyChain: MultiSigKeyChain

  generateKey() {
    throw NotImplemented
  }

  importKey(_: Buffer): boolean {
    return false
  }

  sign(_: Buffer): Buffer {
    return this.privk
  }

  recover(msg: Buffer, sig: Buffer): Buffer {
    throw NotImplemented
  }

  verify(msg: Buffer, sig: Buffer): boolean {
    throw NotImplemented
  }

  getAddress(): Buffer {
    return this.pubk
  }

  getAddressString(): string {
    const addr: Buffer = SECP256k1KeyPair.addressFromPublicKey(this.pubk)
    const type: SerializedType = "bech32"
    return serialization.bufferToType(
      addr,
      type,
      this.keyChain.getHRP(),
      this.keyChain.getChainID()
    )
  }

  create(...args: any[]): this {
    if (args.length == 3) {
      return new MultiSigKeyPair(args[0], args[1], args[2]) as this
    }
    return new MultiSigKeyPair(this.keyChain, this.pubk, this.privk) as this
  }

  clone(): this {
    return new MultiSigKeyPair(this.keyChain, this.pubk, this.privk) as this
  }

  getPrivateKeyString(): string {
    return bintools.cb58Encode(this.privk)
  }

  getPublicKeyString(): string {
    return bintools.cb58Encode(this.pubk)
  }

  constructor(keyChain: MultiSigKeyChain, address: Buffer, signature: Buffer) {
    super()
    this.keyChain = keyChain
    this.pubk = Buffer.from(address)
    this.privk = Buffer.from(signature)
  }
}

/**
 * Class for representing a multisig keyChain in Camino.
 *
 * @typeparam MultisigKeyChain Class extending [[StandardKeyChain]]
 */
export class MultiSigKeyChain extends StandardKeyChain<MultiSigKeyPair> {
  // The HRP required for address generation
  protected hrp: string
  // The chain ID required for address generation
  protected chainID: string
  // The bytes which are signed by this txID
  protected signedBytes: Buffer
  // MultiSigAliases which are resolved in getKeys
  protected msigAliases: MultiSigAliasSet

  getHRP(): string {
    return this.hrp
  }

  getChainID(): string {
    return this.chainID
  }

  create(...args: any[]): this {
    if (args.length == 4) {
      return new MultiSigKeyChain(args[0], args[1], args[2], args[3]) as this
    }
    return new MultiSigKeyChain(
      this.msigAliases,
      this.signedBytes,
      this.hrp,
      this.chainID
    ) as this
  }

  clone(): this {
    const newkc = new MultiSigKeyChain(
      this.msigAliases,
      this.signedBytes,
      this.hrp,
      this.chainID
    ) as this
    for (let k in this.keys) {
      newkc.addKey(this.keys[`${k}`].clone())
    }
    return newkc
  }

  union(kc: this): this {
    if (
      kc.chainID !== this.chainID ||
      kc.hrp != this.hrp ||
      kc.signedBytes.compare(this.signedBytes) != 0
    ) {
      throw new Error("keychains do not match")
    }
    const newkc = kc.clone()
    Object.assign(newkc.keys, kc.keys)

    return newkc
  }

  getKeys = (address: Buffer): MultiSigKeyPair[] => {
    const result: MultiSigKeyPair[] = []

    type stackItem = {
      index: number
      verified: number
      owners: OutputOwners
    }

    var visited: number
    const cycleCheck = new Set<Buffer>()
    const stack: stackItem[] = [
      {
        index: 0,
        verified: 0,
        owners: new OutputOwners([address], undefined, 1)
      }
    ]

    Stack: while (stack.length > 0) {
      // get head
      const currentStack = stack[stack.length - 1]
      while (
        currentStack.index < currentStack.owners.getAddresses().length &&
        currentStack.verified < currentStack.owners.getThreshold()
      ) {
        // get the next address to check
        const addr = currentStack.owners.getAddress(currentStack.index)
        currentStack.index++
        // Is it a multi-sig address ?
        const alias = this.msigAliases.get(addr.toString())
        if (alias !== undefined) {
          // multi-sig
          if (stack.length > MaxSignatures) {
            throw TooManySignatures
          }
          if (cycleCheck.has(addr)) {
            throw new Error("cyclink multisig alias")
          }
          cycleCheck.add(addr)
          stack.push({ index: 0, verified: 0, owners: alias })
          continue Stack
        } else {
          // non-multi-sig
          if (visited > MaxSignatures) {
            throw TooManySignatures
          }
          const sig = this.keys[addr.toString("hex")]
          if (sig !== undefined) {
            result.push(sig)
            currentStack.verified++
          }
          visited++
        }
      }
      // verify current level
      if (currentStack.verified < currentStack.owners.getThreshold()) {
        throw new Error("not enough signatures")
      }
      // remove head
      stack.pop()
      // apply child verification
      if (stack.length > 0) {
        stack[stack.length - 1].verified++
      }
    }
    return result
  }

  constructor(
    msigAliases: MultiSigAliasSet,
    signedBytes: Buffer,
    hrp: string,
    chainID: string
  ) {
    super()
    this.msigAliases = msigAliases
    this.signedBytes = Buffer.from(signedBytes)
    this.hrp = hrp
    this.chainID = chainID
  }
}
