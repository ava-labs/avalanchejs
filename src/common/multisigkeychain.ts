/**
 * @packageDocumentation
 * @module Common-MultisigKeyChain
 */

import { Buffer } from "buffer/"
import {
  Credential,
  OutputOwners,
  SECPMultisigCredential,
  SigIdx,
  Signature
} from "."

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
  // the OutputOwners of all inputs and Auths inside the message
  protected txOwners: OutputOwners[]
  // the multisig aliases which take part in evaluation
  protected msigAliases: Map<string, OutputOwners>
  // Credentials for all the txOwners
  protected sigIdxs: SigIdx[][]
  // The CredentialID used for SECPMultisigCredential
  protected credTypeID: number

  getHRP(): string {
    return this.hrp
  }

  getChainID(): string {
    return this.chainID
  }

  create(...args: any[]): this {
    if (args.length == 4) {
      return new MultisigKeyChain(args[0], args[1], args[2], args[4]) as this
    }
    return new MultisigKeyChain(
      this.hrp,
      this.chainID,
      this.signedBytes,
      this.credTypeID
    ) as this
  }

  clone(): this {
    const newkc = new MultisigKeyChain(
      this.hrp,
      this.chainID,
      this.signedBytes,
      this.credTypeID
    ) as this
    for (let k in this.keys) {
      newkc.addKey(this.keys[`${k}`].clone())
    }
    newkc.txOwners = new Array(this.txOwners.length)
    this.txOwners.forEach((txo, index) =>
      newkc.txOwners[index].fromBuffer(txo.toBuffer())
    )
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

  // Visit every txOutputOwner and try to verify with keys.
  // Traverse into msig aliases. Throw if one cannot be fulfilled
  buildSignatureIndices() {
    this.sigIdxs = []
    for (const o of this.txOwners) this._traverseOwner(o)
  }

  getCredentials(): Credential[] {
    const result: SECPMultisigCredential[] = []
    for (const sigSet of this.sigIdxs) {
      const cred = new SECPMultisigCredential(this.credTypeID)
      for (const sigIdx of sigSet) {
        cred.addSSignatureIndex(sigIdx)
        const sig = new Signature()
        sig.fromBuffer(this.getKey(sigIdx.getSource()).getPrivateKey())
        cred.addSignature(sig)
      }
      result.push(cred)
    }
    return result
  }

  protected _traverseOwner(owner: OutputOwners): void {
    var addrVisited = 0
    var addrVerified = 0

    type stackItem = {
      index: number
      verified: number
      addrVerifiedTotal: number
      parentVerified: boolean
      owners: OutputOwners
    }

    const cycleCheck = new Set<string>()
    const stack: stackItem[] = [
      {
        index: 0,
        verified: 0,
        addrVerifiedTotal: 0,
        parentVerified: false,
        owners: owner
      }
    ]

    const sigIdxs: SigIdx[] = []
    const helper = Buffer.alloc(4)

    Stack: while (stack.length > 0) {
      // get head
      var currentStack = stack[stack.length - 1]
      while (currentStack.index < currentStack.owners.getAddressesLength()) {
        // get the next address to check
        const addr = currentStack.owners.getAddress(currentStack.index)
        const addrStr = addr.toString("hex")
        currentStack.index++
        // Is it a multi-sig address ?
        const alias = this.msigAliases.get(addrStr)
        if (alias !== undefined) {
          if (stack.length > MaxSignatures) {
            throw TooManySignatures
          }
          if (cycleCheck.has(addrStr)) {
            throw new Error("cyclink multisig alias")
          }
          cycleCheck.add(addrStr)
          stack.push({
            index: 0,
            verified: 0,
            addrVerifiedTotal: addrVerified,
            parentVerified:
              currentStack.parentVerified ||
              currentStack.verified >= currentStack.owners.getThreshold(),
            owners: alias
          })
          continue Stack
        } else {
          if (
            !currentStack.parentVerified &&
            currentStack.verified < currentStack.owners.getThreshold()
          ) {
            if (this.hasKey(addr)) {
              if (addrVisited > MaxSignatures) {
                throw TooManySignatures
              }

              const sigIdx = new SigIdx()
              sigIdx.setSource(addr)
              helper.writeUIntBE(addrVisited, 0, 4)
              sigIdx.fromBuffer(helper)
              sigIdxs.push(sigIdx)

              currentStack.verified++
              addrVerified++
            }
          }
          addrVisited++
        }
      }

      // remove head
      stack.pop()
      // verify current level
      if (currentStack.verified < currentStack.owners.getThreshold()) {
        if (stack.length == 0) {
          throw new SignatureError("Not enough signatures")
        }
        // We recover to previous state
        addrVerified = currentStack.addrVerifiedTotal
        sigIdxs.splice(addrVerified)
      } else if (stack.length > 0) {
        currentStack = stack[stack.length - 1]
        if (currentStack.verified < currentStack.owners.getThreshold()) {
          // apply child verification
          currentStack.verified++
        }
      }
    }

    this.sigIdxs.push(sigIdxs)
  }

  constructor(
    hrp: string,
    chainID: string,
    signedBytes: Buffer,
    credTypeID: number,
    txOwners?: OutputOwners[],
    msigAliases?: Map<string, OutputOwners>
  ) {
    super()
    this.hrp = hrp
    this.chainID = chainID
    this.signedBytes = Buffer.from(signedBytes)
    ;(this.credTypeID = credTypeID), (this.txOwners = txOwners ?? [])
    this.msigAliases = msigAliases ?? new Map<string, OutputOwners>()
  }
}
