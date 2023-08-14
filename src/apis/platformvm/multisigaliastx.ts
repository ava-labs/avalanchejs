/**
 * @packageDocumentation
 * @module API-PlatformVM-MultisigAliasTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import { ParseableOutput, TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { Credential, SigIdx, Signature } from "../../common"
import { BaseTx } from "./basetx"
import { DefaultNetworkID } from "../../utils/constants"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import { SelectCredentialClass, SubnetAuth } from "."
import { KeyChain, KeyPair } from "./keychain"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Class representing a Multisig Alias object.
 */
export class MultisigAlias {
  protected id = Buffer.alloc(20)
  protected memo = Buffer.alloc(256)
  protected owners: ParseableOutput = undefined

  constructor(
    id: Buffer = undefined,
    memo: Buffer = undefined,
    owners: ParseableOutput = undefined
  ) {
    if (typeof id !== "undefined") this.id = id
    if (typeof memo !== "undefined") {
      this.memo = memo
    }
    if (typeof owners !== "undefined") this.owners = owners
  }

  getMemo(): Buffer {
    return this.memo
  }

  getOwners(): ParseableOutput {
    return this.owners
  }

  deserialize(fields: object, encoding: SerializedEncoding = "hex"): this {
    this.id = serialization.decoder(fields["id"], encoding, "cb58", "Buffer")
    this.memo = serialization.decoder(
      fields["memo"],
      encoding,
      "utf8",
      "Buffer"
    )
    this.owners.deserialize(fields["owners"], encoding)

    return this
  }

  serialize(encoding: SerializedEncoding = "hex"): object {
    return {
      id: serialization.encoder(this.id, encoding, "Buffer", "cb58"),
      memo: serialization.encoder(this.memo, encoding, "Buffer", "utf8"),
      owners: this.owners.serialize(encoding)
    }
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.id = bintools.copyFrom(bytes, offset, offset + 20)
    offset += 20
    let memolen: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.memo = bintools.copyFrom(bytes, offset, offset + memolen)
    offset += memolen
    this.owners = new ParseableOutput()
    offset = this.owners.fromBuffer(bytes, offset)

    return offset
  }

  toBuffer(): Buffer {
    let bsize: number = this.id.length
    const buffer: Buffer[] = [this.id]

    let memolen: Buffer = Buffer.alloc(4)
    memolen.writeUInt32BE(this.memo.length, 0)
    buffer.push(memolen)
    bsize += 4
    buffer.push(this.memo)
    bsize += this.memo.length

    buffer.push(this.owners.toBuffer())
    bsize += this.owners.toBuffer().length

    return Buffer.concat(buffer, bsize)
  }
}

/**
 * Class representing an unsigned MultisigAlias transaction.
 */
export class MultisigAliasTx extends BaseTx {
  protected _typeName = "MultisigAliasTx"
  protected _typeID = PlatformVMConstants.MULTISIGALIASTX

  // Multisig alias definition. MultisigAlias.ID must be empty if it's the new alias
  protected multisigAlias: MultisigAlias
  // Auth that allows existing owners to change an alias
  protected auth: SubnetAuth
  // Signatures
  protected sigCount: Buffer = Buffer.alloc(4)
  protected sigIdxs: SigIdx[] = [] // idxs of subnet auth signers

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.multisigAlias = new MultisigAlias().deserialize(
      fields["multisigAlias"],
      encoding
    )
  }

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      multisigAlias: this.multisigAlias.serialize(encoding)
    }
  }

  /**
   * Returns the id of the [[MultisigAliasTx]]
   */
  getTxType(): number {
    return PlatformVMConstants.MULTISIGALIASTX
  }

  /**
   * Returns the MultisigAlias definition.
   */
  getMultisigAlias(): MultisigAlias {
    return this.multisigAlias
  }

  /**
   * Returns the Auth that allows existing owners to change an alias.
   */
  getAuth(): SubnetAuth {
    return this.auth
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing a raw [[MultisigAliasTx]], parses it, populates the class, and returns the length of the [[MultisigAliasTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[MultisigAliasTx]]
   * @param offset The offset to start reading the bytes from. Default: 0
   *
   * @returns The length of the raw [[MultisigAliasTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)

    const alias: MultisigAlias = new MultisigAlias()
    offset += alias.fromBuffer(bintools.copyFrom(bytes, offset))
    this.multisigAlias = alias

    const sa: SubnetAuth = new SubnetAuth()
    offset += sa.fromBuffer(bintools.copyFrom(bytes, offset))
    this.auth = sa

    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[MultisigAliasTx]].
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()

    let bsize: number = superbuff.length

    const aliasBuffer: Buffer = this.multisigAlias.toBuffer()
    bsize += aliasBuffer.length

    const authBuffer: Buffer = this.auth.toBuffer()
    bsize += authBuffer.length

    const barr: Buffer[] = [superbuff, aliasBuffer, authBuffer]

    return Buffer.concat(barr, bsize)
  }

  clone(): this {
    const newMultisigAliasTx: MultisigAliasTx = new MultisigAliasTx()
    newMultisigAliasTx.fromBuffer(this.toBuffer())
    return newMultisigAliasTx as this
  }

  create(...args: any[]): this {
    return new MultisigAliasTx(...args) as this
  }

  /**
   * Creates and adds a [[SigIdx]] to the [[MultisigAliasTx]].
   *
   * @param addressIdx The index of the address to reference in the signatures
   * @param address The address of the source of the signature
   */
  addSignatureIdx(addressIdx: number, address: Buffer): void {
    const addressIndex: Buffer = Buffer.alloc(4)
    addressIndex.writeUIntBE(addressIdx, 0, 4)
    this.auth.addAddressIndex(addressIndex)

    const sigidx: SigIdx = new SigIdx()
    const b: Buffer = Buffer.alloc(4)
    b.writeUInt32BE(addressIdx, 0)
    sigidx.fromBuffer(b)
    sigidx.setSource(address)
    this.sigIdxs.push(sigidx)
    this.sigCount.writeUInt32BE(this.sigIdxs.length, 0)
  }

  /**
   * Returns the array of [[SigIdx]] for this [[TX]]
   */
  getSigIdxs(): SigIdx[] {
    return this.sigIdxs
  }

  getCredentialID(): number {
    return PlatformVMConstants.SECPCREDENTIAL
  }

  /**
   * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
   *
   * @param msg A Buffer for the [[UnsignedTx]]
   * @param kc An [[KeyChain]] used in signing
   *
   * @returns An array of [[Credential]]s
   */
  sign(msg: Buffer, kc: KeyChain): Credential[] {
    const creds: Credential[] = super.sign(msg, kc)
    for (const sigidxs of this.sigIdxs) {
      const cred: Credential = SelectCredentialClass(
        PlatformVMConstants.SECPCREDENTIAL
      )
      for (let i: number = 0; i < this.sigIdxs.length; i++) {
        const keypair: KeyPair = kc.getKey(sigidxs[`${i}`].getSource())
        const signval: Buffer = keypair.sign(msg)
        const sig: Signature = new Signature()
        sig.fromBuffer(signval)
        cred.addSignature(sig)
      }
      creds.push(cred)
    }
    return creds
  }

  /**
   * Class representing a MultisigAlias transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param multisigAlias Multisig alias definition. MultisigAlias.ID must be empty if it's the new alias.
   * @param auth Auth that allows existing owners to change an alias.
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    multisigAlias: MultisigAlias = undefined,
    auth: SubnetAuth = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)

    if (multisigAlias) {
      this.multisigAlias = multisigAlias
    } else {
      this.multisigAlias = new MultisigAlias()
    }

    if (auth) {
      this.auth = auth
    } else {
      this.auth = new SubnetAuth()
    }
  }
}
