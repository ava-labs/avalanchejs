/**
 * @packageDocumentation
 * @module API-PlatformVM-AddVoteTx
 */
import { Buffer } from "buffer/"
import { Credential, Signature, UpgradeVersionID } from "../../common"
import BinTools from "../../utils/bintools"
import {
  DefaultNetworkID,
  DefaultTransactionVersionNumber
} from "../../utils/constants"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import { DEFAULT_CAMINOGO_CODEC_VERSION } from "./addproposaltx"
import { BaseTx } from "./basetx"
import { PlatformVMConstants } from "./constants"
import { SelectCredentialClass } from "./credentials"
import { TransferableInput } from "./inputs"
import { KeyChain, KeyPair } from "./keychain"
import { TransferableOutput } from "./outputs"
import { SubnetAuth } from "./subnetauth"
/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

export class SimpleVote {
  private _typeID: number = PlatformVMConstants.SIMPLEVOTE_TYPE_ID
  private optionIndex = Buffer.alloc(4)

  constructor(optionIndex: Buffer) {
    this.optionIndex = optionIndex
  }

  serialize(encoding: SerializedEncoding = "hex"): object {
    return {
      optionIndex: serialization.encoder(
        this.optionIndex,
        encoding,
        "Buffer",
        "number"
      )
    }
  }

  deserialize(fields: object, encoding: SerializedEncoding = "hex"): this {
    this.optionIndex = serialization.decoder(
      fields["optionIndex"],
      encoding,
      "number",
      "Buffer"
    )
    return this
  }

  getTypeId() {
    return this._typeID
  }

  getOptionIndex() {
    return this.optionIndex
  }
}

export class VoteWrapper {
  private vote: SimpleVote

  constructor() {}

  serialize(encoding: SerializedEncoding = "hex"): object {
    return {
      vote: this.vote.serialize(encoding)
    }
  }

  deserialize(fields: object, encoding: SerializedEncoding = "hex"): this {
    this.vote = this.vote.deserialize(fields, encoding)
    return this
  }

  getVote(): SimpleVote {
    return this.vote
  }

  addVote(optionIndex: number) {
    const optionIndexBuff = Buffer.alloc(4)
    optionIndexBuff.writeUInt32BE(optionIndex, 0)
    this.vote = new SimpleVote(optionIndexBuff)
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    // Read the number of length of the following bytes
    bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0)
    offset += 4
    // Read the codec version number
    bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0)
    offset += 2
    const voteTypeId = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    switch (voteTypeId) {
      case PlatformVMConstants.SIMPLEVOTE_TYPE_ID:
        this.vote = new SimpleVote(bintools.copyFrom(bytes, offset, offset + 4))
        offset += 4
        break
      default:
        throw `Unsupported vote type: ${voteTypeId}`
    }
    return offset
  }

  toBuffer(): Buffer {
    const codecVersion = Buffer.alloc(2)
    codecVersion.writeUInt8(DEFAULT_CAMINOGO_CODEC_VERSION, 0)
    const typeId = Buffer.alloc(4)
    typeId.writeUInt32BE(this.vote.getTypeId(), 0)
    const buff = this.vote.getOptionIndex()
    const totalByteLength = 2 + typeId.length + buff.length
    const numLength = Buffer.alloc(4)
    numLength.writeUInt32BE(totalByteLength, 0)
    return Buffer.concat(
      [numLength, codecVersion, typeId, buff],
      numLength.length + totalByteLength
    )
  }
}
/**
 * Class representing an unsigned AddVoteTx transaction.
 */
export class AddVoteTx extends BaseTx {
  protected _typeName = "AddVoteTx"
  protected _typeID = PlatformVMConstants.ADDVOTETX
  protected upgradeVersionID = new UpgradeVersionID()
  protected proposalID = Buffer.alloc(32)
  protected votePayload: VoteWrapper
  protected voterAddress = Buffer.alloc(20)
  protected voterAuth: SubnetAuth

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      voterAddress: serialization.encoder(
        this.voterAddress,
        encoding,
        "Buffer",
        "cb58"
      ),
      voterAuth: this.voterAuth.serialize(encoding),
      votePayload: this.votePayload.serialize(encoding)
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.voterAddress = serialization.decoder(
      fields["voterAddress"],
      encoding,
      "cb58",
      "Buffer",
      20
    )
    this.voterAuth.deserialize(fields["voterAuth"], encoding)
    this.votePayload = this.votePayload.deserialize(fields, encoding)
  }

  /**
   * Returns the id of the [[AddVoteTx]]
   */
  getTxType(): number {
    return this._typeID
  }

  /**
   * Returns the proposal ID
   */
  getProposalID(): Buffer {
    return this.proposalID
  }

  /**
   * Returns the vote payload
   */
  getVotePayload(): VoteWrapper {
    return this.votePayload
  }

  /**
   * Returns the voter address
   */
  getVoterAddress(): Buffer {
    return this.voterAddress
  }

  /**
   * Returns the voter auth
   */
  getVoterAuth(): SubnetAuth {
    return this.voterAuth
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[AddVoteTx]], parses it, populates the class, and returns the length of the [[AddVoteTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[AddVoteTx]]
   *
   * @returns The length of the raw [[AddVoteTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    this.upgradeVersionID = new UpgradeVersionID()
    offset = this.upgradeVersionID.fromBuffer(bytes, offset)

    this.proposalID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    const voteWrapper = new VoteWrapper()
    offset = voteWrapper.fromBuffer(bytes, offset)
    this.votePayload = voteWrapper

    this.voterAddress = bintools.copyFrom(bytes, offset, offset + 20)
    offset += 20
    let sa: SubnetAuth = new SubnetAuth()
    offset += sa.fromBuffer(bintools.copyFrom(bytes, offset))
    this.voterAuth = sa
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[AddVoteTx]].
   */
  toBuffer(): Buffer {
    let upgradeBuf = this.upgradeVersionID.toBuffer()
    const superbuff: Buffer = super.toBuffer()

    const payloadBuffer = this.votePayload.toBuffer()
    let bsize: number =
      upgradeBuf.length +
      superbuff.length +
      this.proposalID.length +
      payloadBuffer.length
    const barr: Buffer[] = [
      upgradeBuf,
      superbuff,
      this.proposalID,
      payloadBuffer
    ]

    bsize += this.voterAddress.length
    barr.push(this.voterAddress)

    const authBuffer = this.voterAuth.toBuffer()
    bsize += authBuffer.length
    barr.push(authBuffer)
    return Buffer.concat(barr, bsize)
  }

  /**
   * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
   *
   * @param msg A Buffer for the [[UnsignedTx]]
   * @param kc A [[KeyChain]] used in signing
   *
   * @returns An array of [[Credential]]s
   */
  sign(msg: Buffer, kc: KeyChain): Credential[] {
    const creds: Credential[] = super.sign(msg, kc)
    // Voter
    const cred: Credential = SelectCredentialClass(
      PlatformVMConstants.SECPCREDENTIAL
    )
    const keypair: KeyPair = kc.getKey(this.voterAddress)
    const signval: Buffer = keypair.sign(msg)
    const sig: Signature = new Signature()
    sig.fromBuffer(signval)
    cred.addSignature(sig)
    creds.push(cred)

    return creds
  }

  /**
   * Class representing an unsigned RegisterNode transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param voteOptionIndex the index of vote option.
   * @param voterAddress the creater(proposer) address.
   * @param voterAuth auth that allows to create a proposal.
   */
  constructor(
    version: number = DefaultTransactionVersionNumber,
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    proposalID: Buffer = undefined,
    voteOptionIndex: number = undefined,
    voterAddress: string | Buffer = undefined,
    voterAuth: SubnetAuth = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    this.upgradeVersionID = new UpgradeVersionID(version)
    if (typeof voterAddress === "string") {
      this.voterAddress = bintools.stringToAddress(voterAddress)
    } else {
      this.voterAddress = voterAddress
    }

    this.proposalID = proposalID
    this.votePayload = new VoteWrapper()
    this.votePayload.addVote(voteOptionIndex)

    if (voterAuth) {
      this.voterAuth = voterAuth
    } else {
      this.voterAuth = new SubnetAuth()
    }
  }
}
