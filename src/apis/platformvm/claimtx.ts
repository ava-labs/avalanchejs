/**
 * @packageDocumentation
 * @module API-PlatformVM-ClaimTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import { TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { BaseTx } from "./basetx"
import { DefaultNetworkID } from "../../utils/constants"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import BN from "bn.js"
import { Credential, SigIdx, Signature } from "../../common"
import { KeyChain, KeyPair } from "caminojs/apis/platformvm/keychain"
import { SelectCredentialClass } from "./credentials"
import { SubnetAuth } from "./subnetauth"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

export enum ClaimType {
  VALIDATOR_REWARD = "0",
  EXPIRED_DEPOSIT_REWARD = "1",
  ALL_TREASURY_REWARD = "2",
  ACTIVE_DEPOSIT_REWARD = "3"
}

//
export class ClaimAmount {
  protected id = Buffer.alloc(32)
  protected type = Buffer.alloc(8)
  protected amount = Buffer.alloc(8)
  protected auth = new SubnetAuth()

  deserialize(fields: object, encoding: SerializedEncoding = "hex"): this {
    this.id = serialization.decoder(fields["id"], encoding, "cb58", "Buffer")

    this.type = serialization.decoder(
      fields["type"],
      encoding,
      "decimalString",
      "Buffer",
      8
    )

    this.amount = serialization.decoder(
      fields["amounts"],
      encoding,
      "decimalString",
      "Buffer"
    )
    return this
  }

  serialize(encoding: SerializedEncoding = "hex"): object {
    return {
      id: serialization.encoder(this.id, encoding, "Buffer", "cb58"),
      type: serialization.encoder(
        this.type,
        encoding,
        "Buffer",
        "decimalString"
      ),
      amount: serialization.encoder(
        this.amount,
        encoding,
        "Buffer",
        "decimalString"
      )
    }
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.id = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    this.type = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8
    this.amount = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8
    offset += this.auth.fromBuffer(bytes, offset)

    return offset
  }

  toBuffer(): Buffer {
    const authBuffer = this.auth.toBuffer()
    return Buffer.concat(
      [this.id, this.type, this.amount, authBuffer],
      32 + 8 + 8 + authBuffer.length
    )
  }

  /**
   * Class representing a ClaimAmount.
   *
   * @param id Optional either depositTxID or OwnableHash, depends on claimType
   * @param claimType Optional specifies the type of reward to claim
   * @param amount Optional the amount to claim from this reward source
   */
  constructor(
    id: Buffer = undefined,
    claimType: ClaimType = undefined,
    amount: BN = undefined,
    auth: Buffer[] = undefined
  ) {
    if (typeof id != "undefined") this.id = id
    if (typeof claimType != "undefined")
      this.type = bintools.fromBNToBuffer(new BN(claimType), 8)
    if (typeof amount != "undefined")
      this.amount = bintools.fromBNToBuffer(amount, 8)
    if (typeof auth != "undefined") this.auth.setAddressIndices(auth)
  }

  getID(): Buffer {
    return this.id
  }
  getType(): Buffer {
    return this.type
  }
  getAmount(): Buffer {
    return this.amount
  }
}

/**
 * Class representing an unsigned ClaimTx transaction.
 */
export class ClaimTx extends BaseTx {
  protected _typeName = "ClaimTx"
  protected _typeID = PlatformVMConstants.CLAIMTX

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.claimAmounts = fields["claimAmounts"].map((sub: Object) =>
      new ClaimAmount().deserialize(sub, encoding)
    )
    this.numClaimAmounts.writeUInt32BE(this.claimAmounts.length, 0)
  }

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      claimAmounts: this.claimAmounts.map((ca) => ca.serialize(encoding))
    }
  }

  protected numClaimAmounts: Buffer = Buffer.alloc(4)
  protected claimAmounts: ClaimAmount[] = []

  protected sigIdxs: SigIdx[][] = [] // one sigIdx[] per claimAmount

  /**
   * Returns the id of the [[RegisterNodeTx]]
   */
  getTxType(): number {
    return this._typeID
  }

  getClaimAmounts(): ClaimAmount[] {
    return this.claimAmounts
  }
  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing a [[ClaimTx]], parses it, populates the class, and returns the length of the [[ClaimTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ClaimTx]]
   *
   * @returns The length of the raw [[ClaimTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)

    this.numClaimAmounts = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const txCount = this.numClaimAmounts.readUInt32BE(0)
    this.claimAmounts = []
    for (let i = 0; i < txCount; i++) {
      const ca = new ClaimAmount()
      offset = ca.fromBuffer(bytes, offset)
      this.claimAmounts.push(ca)
    }
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ClaimTx]].
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()

    let bsize: number = superbuff.length
    const barr: Buffer[] = [superbuff]

    barr.push(this.numClaimAmounts)
    bsize += this.numClaimAmounts.length

    this.claimAmounts.forEach((ca): void => {
      const amount = ca.toBuffer()
      bsize += amount.length
      barr.push(amount)
    })
    return Buffer.concat(barr, bsize)
  }

  clone(): this {
    const newClaimTx: ClaimTx = new ClaimTx()
    newClaimTx.fromBuffer(this.toBuffer())
    return newClaimTx as this
  }

  create(...args: any[]): this {
    return new ClaimTx(...args) as this
  }

  /**
   * Adds an array of [[SigIdx]] to the [[ClaimTx]].
   *
   * @param sigIdxs The Signature indices to verify one claimAmount
   */
  addSigIdxs(sigIdxs: SigIdx[]): void {
    this.sigIdxs.push(sigIdxs)
  }

  /**
   * Returns the array of [[SigIdx[]]] for this [[TX]]
   */
  getSigIdxs(): SigIdx[][] {
    return this.sigIdxs
  }

  /**
   * Class representing an unsigned Claim transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param claimAmounts Optional array of ClaimAmount class instances
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    claimAmounts: ClaimAmount[] = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)

    if (typeof claimAmounts != "undefined") {
      this.numClaimAmounts.writeUInt32BE(claimAmounts.length, 0)
      this.claimAmounts = claimAmounts
    }
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
      for (let i: number = 0; i < sigidxs.length; i++) {
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
}
