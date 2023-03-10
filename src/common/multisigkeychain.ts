/**
 * @packageDocumentation
 * @module Common-MultisigKeyChain
 */

import { Buffer } from "buffer/"
import { OutputOwners, SigIdx } from "."

import { Serialization, SerializedType } from "../utils"
import BinTools from "../utils/bintools"
import { StandardKeyChain, StandardKeyPair } from "./keychain"
import { SECP256k1KeyPair } from "./secp256k1"

export class SignatureError extends Error {}
const NotImplemented = new Error("not implemented in MultiSig KeyPair")
const TooManySignatures = new SignatureError("too many signatures")

const serialization: Serialization = Serialization.getInstance()
const bintools: BinTools = BinTools.getInstance()
const MaxSignatures = 256
const WildcardBuffer = new Buffer([0xff, 0xff, 0xff, 0xff])

export class MultisigAliasSet {
  protected msigs: Map<string, OutputOwners>
  protected addresses: Set<string>
  protected isDryRun = false

  resolveMultisig(source: SigIdx[]): SigIdx[] {
    type stackItem = {
      index: number
      verified: number
      owners: OutputOwners
    }

    var visited: number = 0
    const cycleCheck = new Set<string>()
    const stack: stackItem[] = [
      {
        index: 0,
        verified: 0,
        owners: new OutputOwners(
          source.map((s) => s.getSource()),
          undefined,
          source.length
        )
      }
    ]

    const result: SigIdx[] = []
    const helper = Buffer.alloc(4)
    const noAddresses = this.addresses.size === 0

    Stack: while (stack.length > 0) {
      // get head
      const currentStack = stack[stack.length - 1]
      while (
        currentStack.index < currentStack.owners.getAddresses().length &&
        currentStack.verified < currentStack.owners.getThreshold()
      ) {
        // get the next address to check
        const addr = currentStack.owners.getAddress(currentStack.index)
        const addrString = addr.toString("hex")
        currentStack.index++
        // Is it a multi-sig address ?
        const alias = this.msigs.get(addrString)
        if (alias !== undefined) {
          // multi-sig
          if (stack.length > MaxSignatures) {
            throw TooManySignatures
          }
          if (cycleCheck.has(addrString)) {
            throw new Error("cyclink multisig alias")
          }
          cycleCheck.add(addrString)
          // Ignore empty alias definitions
          if (alias.getThreshold() > 0) {
            stack.push({ index: 0, verified: 0, owners: alias })
            continue Stack
          }
        } else {
          // non-multi-sig
          if (visited > MaxSignatures) {
            throw TooManySignatures
          }
          // Special case for preparing Signavault
          if (noAddresses || this.addresses.has(addrString)) {
            const sigIdx = new SigIdx()
            if (noAddresses) {
              sigIdx.fromBuffer(WildcardBuffer)
            } else {
              sigIdx.setSource(addr)
              helper.writeUIntBE(visited, 0, 4)
              sigIdx.fromBuffer(helper)
            }
            result.push(sigIdx)
            currentStack.verified++
          }
          visited++
        }
      }
      // verify current level
      if (currentStack.verified < currentStack.owners.getThreshold()) {
        throw new SignatureError("not enough signatures")
      }
      // remove head
      stack.pop()
      // apply child verification
      if (stack.length > 0) {
        stack[stack.length - 1].verified++
      }
    }
    return this.isDryRun ? source : result
  }

  dryRun(enable: boolean) {
    this.isDryRun = enable
  }

  clearAddresses(): void {
    this.addresses.clear()
  }

  constructor(msigs: Map<string, OutputOwners>, addresses: Set<string>) {
    this.msigs = msigs
    this.addresses = addresses
  }
}

/**
 * Class for representing a generic multi signature key.
 */
export class MultisigKeyPair extends StandardKeyPair {
  // The keychain required for address generation
  protected keyChain: MultisigKeyChain

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
      return new MultisigKeyPair(args[0], args[1], args[2]) as this
    }
    return new MultisigKeyPair(this.keyChain, this.pubk, this.privk) as this
  }

  clone(): this {
    return new MultisigKeyPair(this.keyChain, this.pubk, this.privk) as this
  }

  getPrivateKeyString(): string {
    return bintools.cb58Encode(this.privk)
  }

  getPublicKeyString(): string {
    return bintools.cb58Encode(this.pubk)
  }

  constructor(keyChain: MultisigKeyChain, address: Buffer, signature: Buffer) {
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
export class MultisigKeyChain extends StandardKeyChain<MultisigKeyPair> {
  // The HRP required for address generation
  protected hrp: string
  // The chain ID required for address generation
  protected chainID: string
  // The bytes which are signed by this txID
  protected signedBytes: Buffer

  getHRP(): string {
    return this.hrp
  }

  getChainID(): string {
    return this.chainID
  }

  create(...args: any[]): this {
    if (args.length == 3) {
      return new MultisigKeyChain(args[0], args[1], args[2]) as this
    }
    return new MultisigKeyChain(
      this.signedBytes,
      this.hrp,
      this.chainID
    ) as this
  }

  clone(): this {
    const newkc = new MultisigKeyChain(
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

  constructor(signedBytes: Buffer, hrp: string, chainID: string) {
    super()
    this.signedBytes = Buffer.from(signedBytes)
    this.hrp = hrp
    this.chainID = chainID
  }
}
