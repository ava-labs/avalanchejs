/**
 * @packageDocumentation
 * @module API-PlatformVM-DepositTx
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
import { SubnetAuth } from "../../apis/platformvm/subnetauth"
import { Credential, SigIdx, Signature, UpgradeVersionID } from "../../common"
import { KeyChain, KeyPair } from "../../apis/platformvm/keychain"
import { SelectCredentialClass } from "../../apis/platformvm/credentials"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

export enum OfferFlag {
  NONE = "0",
  LOCKED = "1"
}

export class Offer {
  protected upgradeVersionID: UpgradeVersionID
  protected interestRateNominator = Buffer.alloc(8)
  protected start = Buffer.alloc(8)
  protected end = Buffer.alloc(8)
  protected minAmount = Buffer.alloc(8)
  protected totalMaxAmount = Buffer.alloc(8)
  protected depositedAmount = Buffer.alloc(8)
  protected minDuration = Buffer.alloc(4)
  protected maxDuration = Buffer.alloc(4)
  protected unlockPeriodDuration = Buffer.alloc(4)
  protected noRewardsPeriodDuration = Buffer.alloc(4)
  protected memo = Buffer.alloc(0)
  protected flags = Buffer.alloc(8)
  protected totalMaxRewardAmount = Buffer.alloc(8)
  protected rewardedAmount = Buffer.alloc(8)
  protected ownerAddress = Buffer.alloc(20)

  constructor(
    upgradeVersion: number = undefined,
    interestRateNominator: BN = undefined,
    start: BN = undefined,
    end: BN = undefined,
    minAmount: BN = undefined,
    totalMaxAmount: BN = undefined,
    depositedAmount: BN = undefined,
    minDuration: number = undefined,
    maxDuration: number = undefined,
    unlockPeriodDuration: number = undefined,
    noRewardsPeriodDuration: number = undefined,
    memo: Buffer = undefined,
    flag: OfferFlag | BN = undefined,
    totalMaxRewardAmount: BN = undefined,
    rewardedAmount: BN = undefined,
    ownerAddress: Buffer = undefined
  ) {
    this.upgradeVersionID = new UpgradeVersionID(upgradeVersion ?? 0)
    this.interestRateNominator = bintools.fromBNToBuffer(
      new BN(interestRateNominator),
      8
    )
    if (typeof start !== "undefined") {
      this.start = bintools.fromBNToBuffer(new BN(start), 8)
    }
    if (typeof end !== "undefined") {
      this.end = bintools.fromBNToBuffer(new BN(end), 8)
    }
    if (typeof minAmount !== "undefined") {
      this.minAmount = bintools.fromBNToBuffer(new BN(minAmount), 8)
    }
    if (typeof totalMaxAmount !== "undefined") {
      this.totalMaxAmount = bintools.fromBNToBuffer(new BN(totalMaxAmount), 8)
    }
    if (typeof depositedAmount !== "undefined") {
      this.depositedAmount = bintools.fromBNToBuffer(new BN(depositedAmount), 8)
    }
    if (typeof minDuration !== "undefined") {
      this.minDuration.writeUInt32BE(minDuration, 0)
    }
    if (typeof maxDuration !== "undefined") {
      this.maxDuration.writeUInt32BE(maxDuration, 0)
    }
    if (typeof unlockPeriodDuration !== "undefined") {
      this.unlockPeriodDuration.writeUInt32BE(unlockPeriodDuration, 0)
    }
    if (typeof noRewardsPeriodDuration !== "undefined") {
      this.noRewardsPeriodDuration.writeUInt32BE(noRewardsPeriodDuration, 0)
    }
    if (typeof memo !== "undefined") {
      this.memo = memo
    }
    if (typeof flag != "undefined") {
      if (flag instanceof BN) {
        this.flags = bintools.fromBNToBuffer(flag, 8)
      } else {
        this.flags = bintools.fromBNToBuffer(new BN(flag), 8)
      }
    }
    if (this.upgradeVersionID.version() > 0) {
      if (typeof totalMaxRewardAmount !== "undefined") {
        this.totalMaxRewardAmount = bintools.fromBNToBuffer(
          new BN(totalMaxRewardAmount),
          8
        )
      }
      if (typeof rewardedAmount !== "undefined") {
        this.rewardedAmount = bintools.fromBNToBuffer(new BN(rewardedAmount), 8)
      }
      if (typeof ownerAddress != "undefined") {
        this.ownerAddress = ownerAddress
      }
    }
  }

  getMemo(): Buffer {
    return this.memo
  }

  deserialize(fields: object, encoding: SerializedEncoding = "hex"): this {
    const upgradeVersion = serialization.decoder(
      fields["upgradeVersion"],
      encoding,
      "decimalString",
      "Buffer"
    )
    this.upgradeVersionID = new UpgradeVersionID(upgradeVersion)

    this.interestRateNominator = serialization.decoder(
      fields["interestRateNominator"],
      encoding,
      "decimalString",
      "Buffer"
    )
    this.start = serialization.decoder(
      fields["start"],
      encoding,
      "decimalString",
      "Buffer"
    )
    this.end = serialization.decoder(
      fields["end"],
      encoding,
      "decimalString",
      "Buffer"
    )
    this.minAmount = serialization.decoder(
      fields["minAmount"],
      encoding,
      "decimalString",
      "Buffer"
    )
    this.totalMaxAmount = serialization.decoder(
      fields["totalMaxAmount"],
      encoding,
      "decimalString",
      "Buffer"
    )
    this.depositedAmount = serialization.decoder(
      fields["depositedAmount"],
      encoding,
      "decimalString",
      "Buffer"
    )
    this.minDuration = serialization.decoder(
      fields["minDuration"],
      encoding,
      "decimalString",
      "Buffer"
    )
    this.maxDuration = serialization.decoder(
      fields["maxDuration"],
      encoding,
      "decimalString",
      "Buffer"
    )
    this.unlockPeriodDuration = serialization.decoder(
      fields["unlockPeriodDuration"],
      encoding,
      "decimalString",
      "Buffer"
    )
    this.noRewardsPeriodDuration = serialization.decoder(
      fields["noRewardsPeriodDuration"],
      encoding,
      "decimalString",
      "Buffer"
    )
    this.memo = serialization.decoder(
      fields["memo"],
      encoding,
      "utf8",
      "Buffer"
    )
    this.flags = serialization.decoder(
      fields["flags"],
      encoding,
      "decimalString",
      "Buffer"
    )
    if (this.upgradeVersionID.version() > 0) {
      this.totalMaxRewardAmount = serialization.decoder(
        fields["totalMaxRewardAmount"],
        encoding,
        "decimalString",
        "Buffer"
      )
      this.rewardedAmount = serialization.decoder(
        fields["rewardedAmount"],
        encoding,
        "decimalString",
        "Buffer"
      )

      this.ownerAddress = serialization.decoder(
        fields["ownerAddress"],
        encoding,
        "cb58",
        "Buffer"
      )
    }

    return this
  }

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields = {
      upgradeVersion: serialization.encoder(
        this.upgradeVersionID.version(),
        encoding,
        "Buffer",
        "decimalString"
      ),

      interestRateNominator: serialization.encoder(
        this.interestRateNominator,
        encoding,
        "Buffer",
        "decimalString"
      ),

      start: serialization.encoder(
        this.start,
        encoding,
        "Buffer",
        "decimalString"
      ),
      end: serialization.encoder(this.end, encoding, "Buffer", "decimalString"),
      minAmount: serialization.encoder(
        this.minAmount,
        encoding,
        "Buffer",
        "decimalString"
      ),
      totalMaxAmount: serialization.encoder(
        this.totalMaxAmount,
        encoding,
        "Buffer",
        "decimalString"
      ),
      depositedAmount: serialization.encoder(
        this.depositedAmount,
        encoding,
        "Buffer",
        "decimalString"
      ),
      minDuration: serialization.encoder(
        this.minDuration,
        encoding,
        "Buffer",
        "decimalString"
      ),
      maxDuration: serialization.encoder(
        this.maxDuration,
        encoding,
        "Buffer",
        "decimalString"
      ),
      unlockPeriodDuration: serialization.encoder(
        this.unlockPeriodDuration,
        encoding,
        "Buffer",
        "decimalString"
      ),
      noRewardsPeriodDuration: serialization.encoder(
        this.noRewardsPeriodDuration,
        encoding,
        "Buffer",
        "decimalString"
      ),
      memo: serialization.encoder(this.memo, encoding, "Buffer", "utf8"),
      flags: serialization.encoder(
        this.flags,
        encoding,
        "Buffer",
        "decimalString"
      )
    }

    if (this.upgradeVersionID.version() > 0) {
      return {
        ...fields,
        totalMaxRewardAmount: serialization.encoder(
          this.totalMaxRewardAmount,
          encoding,
          "Buffer",
          "decimalString"
        ),
        rewardedAmount: serialization.encoder(
          this.rewardedAmount,
          encoding,
          "Buffer",
          "decimalString"
        ),
        ownerAddress: serialization.encoder(
          this.ownerAddress,
          encoding,
          "Buffer",
          "cb58"
        )
      }
    }
    return fields
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = this.upgradeVersionID.fromBuffer(bytes, offset)
    this.interestRateNominator = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8
    this.start = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8

    this.end = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8
    this.minAmount = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8
    this.totalMaxAmount = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8
    this.depositedAmount = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8
    this.minDuration = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    this.maxDuration = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    this.unlockPeriodDuration = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    this.noRewardsPeriodDuration = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const memoLen: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.memo = bintools.copyFrom(bytes, offset, offset + memoLen)

    offset += memoLen
    this.flags = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8
    if (this.upgradeVersionID.version() > 0) {
      this.totalMaxRewardAmount = bintools.copyFrom(bytes, offset, offset + 8)
      offset += 8
      this.rewardedAmount = bintools.copyFrom(bytes, offset, offset + 8)
      offset += 8
      this.ownerAddress = bintools.copyFrom(bytes, offset, offset + 20)
      offset += 20
    }

    return offset
  }

  toBuffer(): Buffer {
    let memoLength: Buffer = Buffer.alloc(4)
    memoLength.writeUInt32BE(this.memo.length, 0)
    let upgradeBuffer = this.upgradeVersionID.toBuffer()
    let bsize: number =
      upgradeBuffer.length +
      this.interestRateNominator.length +
      this.start.length +
      this.end.length +
      this.minAmount.length +
      this.totalMaxAmount.length +
      this.depositedAmount.length +
      this.minDuration.length +
      this.maxDuration.length +
      this.unlockPeriodDuration.length +
      this.noRewardsPeriodDuration.length +
      memoLength.length +
      this.memo.length +
      this.flags.length

    const buffer: Buffer[] = [
      upgradeBuffer,
      this.interestRateNominator,
      this.start,
      this.end,
      this.minAmount,
      this.totalMaxAmount,
      this.depositedAmount,
      this.minDuration,
      this.maxDuration,
      this.unlockPeriodDuration,
      this.noRewardsPeriodDuration,
      memoLength,
      this.memo,
      this.flags
    ]

    if (this.upgradeVersionID.version() > 0) {
      bsize +=
        this.totalMaxRewardAmount.length +
        this.rewardedAmount.length +
        this.ownerAddress.length
      buffer.push(
        this.totalMaxRewardAmount,
        this.rewardedAmount,
        this.ownerAddress
      )
    }
    return Buffer.concat(buffer, bsize)
  }
}

/**
 * Class representing an unsigned AddDepositOfferTx transaction.
 */
export class AddDepositOfferTx extends BaseTx {
  protected _typeName = "AddDepositOfferTx"
  protected _typeID = PlatformVMConstants.ADDDEPOSITOFFERTX

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      depositOffer: this.depositOffer.serialize(encoding),
      depositOfferCreatorAddress: serialization.encoder(
        this.depositOfferCreatorAddress,
        encoding,
        "Buffer",
        "cb58"
      ),
      depositOfferCreatorAuth: this.depositOfferCreatorAuth.serialize(encoding)
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.depositOffer = new Offer().deserialize(
      fields["depositOffer"],
      encoding
    )
    this.depositOfferCreatorAddress = serialization.decoder(
      fields["depositOfferCreatorAddress"],
      encoding,
      "cb58",
      "Buffer"
    )
    this.depositOfferCreatorAuth.deserialize(
      fields["depositOfferCreatorAuth"],
      encoding
    )
  }

  // The deposit offer to add
  protected depositOffer: Offer
  // The address of the account that creates the deposit offer
  protected depositOfferCreatorAddress: Buffer = Buffer.alloc(20)
  // The auth of the deposit offer creator address
  protected depositOfferCreatorAuth: SubnetAuth
  protected sigCount: Buffer = Buffer.alloc(4)
  protected sigIdxs: SigIdx[] = [] // idxs of signers

  /**
   * Creates and adds a [[SigIdx]] to the [[AddDepositOfferTx]].
   *
   * @param addressIdx The index of the address to reference in the signatures
   * @param address The address of the source of the signature
   */
  addSignatureIdx(addressIdx: number, address: Buffer): void {
    const addressIndex: Buffer = Buffer.alloc(4)
    addressIndex.writeUIntBE(addressIdx, 0, 4)
    this.depositOfferCreatorAuth.addAddressIndex(addressIndex)

    const sigidx: SigIdx = new SigIdx()
    const b: Buffer = Buffer.alloc(4)
    b.writeUInt32BE(addressIdx, 0)
    sigidx.fromBuffer(b)
    sigidx.setSource(address)
    this.sigIdxs.push(sigidx)
    this.sigCount.writeUInt32BE(this.sigIdxs.length, 0)
  }

  /**
   * Returns the id of the [[RegisterNodeTx]]
   */
  getTxType(): number {
    return this._typeID
  }

  getDepositOffer(): Offer {
    return this.depositOffer
  }
  getDepositOfferCreatorAddress(): Buffer {
    return this.depositOfferCreatorAddress
  }
  getDepositOfferCreatorAuth(): SubnetAuth {
    return this.depositOfferCreatorAuth
  }
  getSigIdxs(): SigIdx[] {
    return this.sigIdxs
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
    const cred: Credential = SelectCredentialClass(
      PlatformVMConstants.SECPCREDENTIAL
    )
    for (const sigidx of this.sigIdxs) {
      const keypair: KeyPair = kc.getKey(sigidx.getSource())
      const signval: Buffer = keypair.sign(msg)
      const sig: Signature = new Signature()
      sig.fromBuffer(signval)
      cred.addSignature(sig)
    }
    creds.push(cred)
    return creds
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing a [[AddDepositOfferTx]], parses it, populates the class, and returns the length of the [[AddDepositOfferTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[AddDepositOfferTx]]
   *
   * @returns The length of the raw [[AddDepositOfferTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)

    const depositOffer: Offer = new Offer()
    offset = depositOffer.fromBuffer(bytes, offset)
    this.depositOffer = depositOffer

    this.depositOfferCreatorAddress = bintools.copyFrom(
      bytes,
      offset,
      offset + 20
    )
    offset += 20

    const sa: SubnetAuth = new SubnetAuth()
    offset += sa.fromBuffer(bintools.copyFrom(bytes, offset))
    this.depositOfferCreatorAuth = sa

    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[AddDepositOfferTx]].
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()

    let bsize: number = superbuff.length

    const depositOfferBuffer: Buffer = this.depositOffer.toBuffer()
    bsize += depositOfferBuffer.length

    const authBuffer: Buffer = this.depositOfferCreatorAuth.toBuffer()
    bsize += authBuffer.length

    const barr: Buffer[] = [
      superbuff,
      depositOfferBuffer,
      this.depositOfferCreatorAddress,
      authBuffer
    ]

    return Buffer.concat(barr, bsize + 20)
  }

  clone(): this {
    const newAddDepositOfferTx: AddDepositOfferTx = new AddDepositOfferTx()
    newAddDepositOfferTx.fromBuffer(this.toBuffer())
    return newAddDepositOfferTx as this
  }

  create(...args: any[]): this {
    return new AddDepositOfferTx(...args) as this
  }

  /**
   * Class representing an unsigned AddDepositOfferTx transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param depositOffer Offer to be used for this deposit
   * @param depositOfferCreatorAddress Address of the node that created the offer
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    depositOffer: Offer = undefined,
    depositOfferCreatorAddress: Buffer = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    if (typeof depositOffer !== "undefined") {
      this.depositOffer = depositOffer
    } else {
      this.depositOffer = new Offer()
    }

    if (typeof depositOfferCreatorAddress != "undefined") {
      this.depositOfferCreatorAddress = depositOfferCreatorAddress
    }
    this.depositOfferCreatorAuth = new SubnetAuth()
  }
}
