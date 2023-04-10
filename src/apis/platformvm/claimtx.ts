/**
 * @packageDocumentation
 * @module API-PlatformVM-ClaimTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import { ParseableOutput, TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { BaseTx } from "./basetx"
import { DefaultNetworkID } from "../../utils/constants"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import BN from "bn.js"
import { Credential, SigIdx, Signature } from "../../common"
import { KeyChain, KeyPair } from "caminojs/apis/platformvm/keychain"
import { SelectCredentialClass } from "./credentials"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

export const ClaimType = {
  VALIDATOR_REWARD: new BN("1"),
  EXPIRED_DEPOSIT_REWARD: new BN("2"),
  ALL: new BN("3")
} as const

/**
 * Class representing an unsigned ClaimTx transaction.
 */
export class ClaimTx extends BaseTx {
  protected _typeName = "ClaimTx"
  protected _typeID = PlatformVMConstants.CLAIMTX

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)

    this.depositTxs = fields["depositTxs"].map((txID: string) =>
      serialization.decoder(txID, encoding, "cb58", "Buffer")
    )
    this.claimableOwnerIDs = fields["claimableOwnerIDs"].map(
      (ownerID: string) =>
        serialization.decoder(ownerID, encoding, "cb58", "Buffer")
    )
    this.claimedAmounts = fields["claimedAmounts"].map((amount: string) =>
      serialization.decoder(amount, encoding, "decimalString", "Buffer")
    )

    this.claimType = serialization.decoder(
      fields["claimType"],
      encoding,
      "decimalString",
      "Buffer",
      8
    )
    this.claimTo.deserialize(fields["claimTo"], encoding)

    // initialize other num fields
    this.numDepositTxs.writeUInt32BE(this.numDepositTxs.length, 0)
    this.numClaimableOwnerIDs.writeUInt32BE(this.numClaimableOwnerIDs.length, 0)
    this.numClaimedAmounts.writeUInt32BE(this.numClaimedAmounts.length, 0)
  }

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      depositTxs: this.depositTxs.map((txID) =>
        serialization.encoder(txID, encoding, "Buffer", "cb58")
      ),
      claimableOwnerIDs: this.claimableOwnerIDs.map((ownerID) =>
        serialization.encoder(ownerID, encoding, "Buffer", "cb58")
      ),
      claimedAmounts: this.claimedAmounts.map((amount) =>
        serialization.encoder(amount, encoding, "Buffer", "decimalString")
      ),
      claimType: serialization.encoder(
        this.claimType,
        encoding,
        "Buffer",
        "decimalString"
      ),
      claimTo: this.claimTo.serialize(encoding)
    }
  }

  protected numDepositTxs: Buffer = Buffer.alloc(4)
  protected depositTxs: Buffer[] = []

  protected numClaimableOwnerIDs: Buffer = Buffer.alloc(4)
  protected claimableOwnerIDs: Buffer[] = []

  protected numClaimedAmounts: Buffer = Buffer.alloc(4)
  protected claimedAmounts: Buffer[] = []

  protected claimType: Buffer = Buffer.alloc(8)

  // Deposit rewards outputs will be minted to this owner, unless all of its fields has zero-values.
  // If it is empty, deposit rewards will be minted for depositTx.RewardsOwner.
  protected claimTo: ParseableOutput = undefined
  protected sigCount: Buffer = Buffer.alloc(4)
  protected sigIdxs: SigIdx[] = [] // idxs of claimableIn signers

  /**
   * Returns the id of the [[RegisterNodeTx]]
   */
  getTxType(): number {
    return this._typeID
  }

  /**
   * Returns the array of claimed owner ids
   */
  getClaimableOwnerIDs(): Buffer[] {
    return this.claimableOwnerIDs
  }

  /**
   * Returns the array of claimed amounts
   */
  getClaimedAmounts(): Buffer[] {
    return this.claimedAmounts
  }
  /**
   * Returns the array of deposit tx ids
   */
  getDepositTxs(): Buffer[] {
    return this.depositTxs
  }

  /**
   * Returns the claimTo
   */
  getClaimTo(): ParseableOutput {
    return this.claimTo
  }

  getClaimType(): Buffer {
    return this.claimType
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

    this.numDepositTxs = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const txCount: number = this.numDepositTxs.readUInt32BE(0)
    this.depositTxs = []
    for (let i: number = 0; i < txCount; i++) {
      const txid: Buffer = bintools.copyFrom(bytes, offset, offset + 32)
      offset += 32
      this.depositTxs.push(txid)
    }

    this.numClaimableOwnerIDs = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const ownerCount: number = this.numClaimableOwnerIDs.readUInt32BE(0)
    this.claimableOwnerIDs = []
    for (let i: number = 0; i < ownerCount; i++) {
      const ownerid: Buffer = bintools.copyFrom(bytes, offset, offset + 32)
      offset += 32
      this.claimableOwnerIDs.push(ownerid)
    }

    this.numClaimedAmounts = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const amountCount: number = this.numClaimedAmounts.readUInt32BE(0)
    this.claimedAmounts = []
    for (let i: number = 0; i < amountCount; i++) {
      const amount: Buffer = bintools.copyFrom(bytes, offset, offset + 8)
      offset += 8
      this.claimedAmounts.push(amount)
    }

    this.claimType = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8
    this.claimTo = new ParseableOutput()
    offset = this.claimTo.fromBuffer(bytes, offset)
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ClaimTx]].
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()

    let bsize: number = superbuff.length
    const barr: Buffer[] = [superbuff]

    barr.push(this.numDepositTxs)
    bsize += this.numDepositTxs.length

    this.depositTxs.forEach((depositTx: Buffer): void => {
      bsize += depositTx.length
      barr.push(depositTx)
    })
    barr.push(this.numClaimableOwnerIDs)
    bsize += this.numClaimableOwnerIDs.length
    this.claimableOwnerIDs.forEach((claimableOwnerID: Buffer): void => {
      barr.push(claimableOwnerID)
      bsize += claimableOwnerID.length
    })

    barr.push(this.numClaimedAmounts)
    bsize += this.numClaimedAmounts.length
    this.claimedAmounts.forEach((claimedAmount: Buffer): void => {
      barr.push(claimedAmount)
      bsize += claimedAmount.length
    })

    barr.push(this.claimType)
    bsize += this.claimType.length
    barr.push(this.claimTo.toBuffer())
    bsize += this.claimTo.toBuffer().length

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
   * Creates and adds a [[SigIdx]] to the [[ClaimTx]].
   *
   * @param addressIdx The index of the address to reference in the signatures
   * @param address The address of the source of the signature
   */
  addSignatureIdx(addressIdx: number, address: Buffer): void {
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

  /**
   * Set the array of [[SigIdx]] for this [[TX]]
   */
  setSigIdxs(sigIdxs: SigIdx[]) {
    this.sigIdxs = sigIdxs
    this.sigCount.writeUInt32BE(this.sigIdxs.length, 0)
  }
  /**
   * Class representing an unsigned RegisterNode transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param depositTxIDs Optional array of the deposit tx ids
   * @param claimableOwnerIDs Optional array of the claimable owner ids
   * @param claimedAmounts Optional array of the claimed amounts
   * @param claimType Optional the type of the claim
   * @param claimTo Optional the owner of the rewards
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    depositTxIDs: string[] | Buffer[] = undefined,
    claimableOwnerIDs: string[] | Buffer[] = undefined,
    claimedAmounts: BN[] = undefined,
    claimType: BN = undefined,
    claimTo: ParseableOutput = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)

    if (typeof depositTxIDs != "undefined") {
      this.numDepositTxs.writeUInt32BE(depositTxIDs.length, 0)
      const depositTxBufs: Buffer[] = []
      depositTxIDs.forEach((txID: string | Buffer): void => {
        if (typeof txID === "string") {
          depositTxBufs.push(bintools.cb58Decode(txID))
        } else {
          depositTxBufs.push(txID)
        }
      })
      this.depositTxs = depositTxBufs
    }

    if (typeof claimableOwnerIDs != "undefined") {
      this.numClaimableOwnerIDs.writeUInt32BE(claimableOwnerIDs.length, 0)
      const claimableOwnerIDBufs: Buffer[] = []
      claimableOwnerIDs.forEach((ownerID: string | Buffer): void => {
        if (typeof ownerID === "string") {
          claimableOwnerIDBufs.push(bintools.cb58Decode(ownerID))
        } else {
          claimableOwnerIDBufs.push(ownerID)
        }
      })
      this.claimableOwnerIDs = claimableOwnerIDBufs
    }

    if (typeof claimedAmounts != "undefined") {
      this.numClaimedAmounts.writeUInt32BE(claimedAmounts.length, 0)
      const claimedAmountBufs: Buffer[] = []
      claimedAmounts.forEach((amount: BN): void => {
        claimedAmountBufs.push(bintools.fromBNToBuffer(amount, 8))
      })
      this.claimedAmounts = claimedAmountBufs
    }

    this.claimType = bintools.fromBNToBuffer(claimType, 8)
    this.claimTo = claimTo
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
    const sigidxs: SigIdx[] = this.getSigIdxs()
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
    return creds
  }
}
