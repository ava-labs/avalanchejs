/**
 * @packageDocumentation
 * @module API-PlatformVM-DepositTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import { ParseableOutput, TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { BaseTx } from "./basetx"
import {
  DefaultNetworkID,
  DefaultTransactionVersionNumber
} from "../../utils/constants"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import { SubnetAuth } from "../../apis/platformvm/subnetauth"
import { KeyChain, KeyPair } from "../../apis/platformvm/keychain"
import { Credential, SigIdx, Signature, UpgradeVersionID } from "../../common"
import { SelectCredentialClass } from "../../apis/platformvm/credentials"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Class representing an unsigned DepositTx transaction.
 */
export class DepositTx extends BaseTx {
  protected _typeName = "DepositTx"
  protected _typeID = PlatformVMConstants.DEPOSITTX

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)

    let fieldsV1: object = {}
    if (this.upgradeVersionID.version() > 0) {
      fieldsV1 = {
        depositCreator: serialization.encoder(
          this.depositCreator,
          encoding,
          "Buffer",
          "cb58"
        ),
        depositCreatorAuth: this.depositCreatorAuth.serialize(encoding),
        ownerAuth: this.ownerAuth.serialize(encoding)
      }
    }

    return {
      ...fields,
      depositOfferID: serialization.encoder(
        this.depositOfferID,
        encoding,
        "Buffer",
        "cb58"
      ),
      depositDuration: serialization.encoder(
        this.depositDuration,
        encoding,
        "Buffer",
        "decimalString"
      ),
      rewardsOwner: this.rewardsOwner.serialize(encoding),
      ...fieldsV1
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.depositOfferID = serialization.decoder(
      fields["depositOfferID"],
      encoding,
      "cb58",
      "Buffer",
      32
    )
    this.depositDuration = serialization.decoder(
      fields["depositDuration"],
      encoding,
      "decimalString",
      "Buffer",
      4
    )
    this.rewardsOwner.deserialize(fields["rewardsOwner"], encoding)

    if (this.upgradeVersionID.version() > 0) {
      this.depositCreator = serialization.decoder(
        fields["depositCreator"],
        encoding,
        "cb58",
        "Buffer"
      )
      this.depositCreatorAuth.deserialize(
        fields["depositCreatorAuth"],
        encoding
      )
      this.ownerAuth.deserialize(fields["ownerAuth"], encoding)
    }
  }
  // UpgradeVersionID (since SP1)
  protected upgradeVersionID: UpgradeVersionID
  // ID of active offer that will be used for this deposit
  protected depositOfferID: Buffer = Buffer.alloc(32)
  // duration of deposit (in 4 byte format)
  protected depositDuration: Buffer = Buffer.alloc(4)
  // Where to send staking rewards when done validating
  protected rewardsOwner: ParseableOutput = new ParseableOutput()
  protected depositCreator: Buffer = Buffer.alloc(20)
  protected depositCreatorAuth: SubnetAuth = new SubnetAuth()
  protected ownerSignatures: Buffer[] = []
  protected ownerAuth: SubnetAuth = new SubnetAuth()
  protected sigCount: Buffer[] = [Buffer.alloc(4), Buffer.alloc(4)]
  protected sigIdxs: SigIdx[][] = [[], []] // idxs of signers

  /**
   * Returns the id of the [[RegisterNodeTx]]
   */
  getTxType(): number {
    return this._typeID
  }

  /**
   * Returns the depositOfferID
   */
  getDepositOfferID(): Buffer {
    return this.depositOfferID
  }

  /**
   * Returns the depositOfferID
   */
  getDepositDuration(): Buffer {
    return this.depositDuration
  }

  /**
   * Returns the depositOfferID
   */
  getRewardsOwner(): ParseableOutput {
    return this.rewardsOwner
  }

  addDepositCreatorAuth(auth: [number, Buffer][]): void {
    auth.forEach((p) =>
      this.addSignatureIdx(0, this.depositCreatorAuth, p[0], p[1])
    )
  }

  addOwnerAuth(auth: [number, Buffer][], sigs: Buffer[]): void {
    auth.forEach((p) =>
      this.addSignatureIdx(1, this.ownerAuth, p[0], undefined)
    )
    this.ownerSignatures = sigs
  }

  getOwnerSignatures(): [Buffer, Buffer][] {
    return this.sigIdxs[1].map((v, i) => [
      v.getSource(),
      this.ownerSignatures[i]
    ])
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing a [[DepositTx]], parses it, populates the class, and returns the length of the [[DepositTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[DepositTx]]
   *
   * @returns The length of the raw [[DepositTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.upgradeVersionID = new UpgradeVersionID()
    offset = this.upgradeVersionID.fromBuffer(bytes, offset)
    offset = super.fromBuffer(bytes, offset)
    this.depositOfferID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    this.depositDuration = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    this.rewardsOwner = new ParseableOutput()
    offset = this.rewardsOwner.fromBuffer(bytes, offset)

    if (this.upgradeVersionID.version() > 0) {
      this.depositCreator = bintools.copyFrom(bytes, offset, offset + 20)
      offset += 20

      let sa = new SubnetAuth()
      offset += sa.fromBuffer(bintools.copyFrom(bytes, offset))
      this.depositCreatorAuth = sa

      sa = new SubnetAuth()
      offset += sa.fromBuffer(bintools.copyFrom(bytes, offset))
      this.ownerAuth = sa
    }
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[DepositTx]].
   */
  toBuffer(): Buffer {
    const upgradeBuf = this.upgradeVersionID.toBuffer()
    const superbuff: Buffer = super.toBuffer()

    let bsize: number =
      upgradeBuf.length +
      superbuff.length +
      this.depositOfferID.length +
      this.depositDuration.length
    const barr: Buffer[] = [
      upgradeBuf,
      superbuff,
      this.depositOfferID,
      this.depositDuration
    ]

    barr.push(this.rewardsOwner.toBuffer())
    bsize += this.rewardsOwner.toBuffer().length

    if (this.upgradeVersionID.version() > 0) {
      barr.push(this.depositCreator)
      bsize += this.depositCreator.length

      let authBuffer: Buffer = this.depositCreatorAuth.toBuffer()
      barr.push(authBuffer)
      bsize += authBuffer.length

      authBuffer = this.ownerAuth.toBuffer()
      barr.push(authBuffer)
      bsize += authBuffer.length
    }
    return Buffer.concat(barr, bsize)
  }

  clone(): this {
    const newDepositTx: DepositTx = new DepositTx()
    newDepositTx.fromBuffer(this.toBuffer())
    return newDepositTx as this
  }

  create(...args: any[]): this {
    return new DepositTx(...args) as this
  }
  /**
   * Creates and adds a [[SigIdx]] to the [[DepositTx]].
   *
   * @param addressIdx The index of the address to reference in the signatures
   * @param address The address of the source of the signature
   */
  addSignatureIdx(
    credPos: number,
    auth: SubnetAuth,
    addressIdx: number,
    address: Buffer
  ): void {
    const sigidx: SigIdx = new SigIdx()
    const b: Buffer = Buffer.alloc(4)
    b.writeUInt32BE(addressIdx, 0)

    auth.addAddressIndex(b)

    sigidx.fromBuffer(b)
    sigidx.setSource(address)
    this.sigIdxs[credPos].push(sigidx)
    this.sigCount[credPos].writeUInt32BE(this.sigIdxs[credPos].length, 0)
  }

  sign(msg: Buffer, kc: KeyChain): Credential[] {
    const creds: Credential[] = super.sign(msg, kc)
    if (this.upgradeVersionID.version() > 0) {
      let cred: Credential = SelectCredentialClass(
        PlatformVMConstants.SECPCREDENTIAL
      )

      for (const sigidx of this.sigIdxs[0]) {
        const keypair: KeyPair = kc.getKey(sigidx.getSource())
        const signval: Buffer = keypair.sign(msg)
        const sig: Signature = new Signature()
        sig.fromBuffer(signval)
        cred.addSignature(sig)
      }
      creds.push(cred)

      cred = SelectCredentialClass(PlatformVMConstants.SECPCREDENTIAL)
      for (const ownerSig of this.ownerSignatures) {
        const sig: Signature = new Signature()
        sig.fromBuffer(ownerSig)
        cred.addSignature(sig)
      }
      creds.push(cred)
    }

    return creds
  }

  /**
   * Class representing an unsigned RegisterNode transaction.
   *
   * @param version Optional. Transaction version number
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param depositOfferID Optional ID of the deposit offer.
   * @param duration Optional Duration of depositing.
   * @param rewardsOwner Optional the owner of the rewards
   * @param depositCreator Address that is authorized to create deposit with given offer.
   */
  constructor(
    version: number = DefaultTransactionVersionNumber,
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    depositOfferID: Buffer = undefined,
    depositDuration: number = undefined,
    rewardsOwner: ParseableOutput = undefined,
    depositCreator: Buffer = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    this.upgradeVersionID = new UpgradeVersionID(version)
    if (typeof depositOfferID != "undefined") {
      this.depositOfferID = depositOfferID
    }
    if (typeof depositDuration != "undefined") {
      this.depositDuration = Buffer.alloc(4)
      this.depositDuration.writeUInt32BE(depositDuration, 0)
    }
    if (typeof rewardsOwner != "undefined") {
      this.rewardsOwner = rewardsOwner
    }
    if (typeof depositCreator != "undefined") {
      this.depositCreator = depositCreator
    }
  }
}
