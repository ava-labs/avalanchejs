/**
 * @packageDocumentation
 * @module API-PlatformVM-RegisterNodeTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import { TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { Credential, SigIdx, Signature } from "../../common"
import { BaseTx } from "./basetx"
import { DefaultNetworkID } from "../../utils/constants"
import {
  bufferToNodeIDString,
  NodeIDStringToBuffer
} from "../../utils/helperfunctions"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import { SelectCredentialClass, SubnetAuth } from "."
import { KeyChain, KeyPair } from "./keychain"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Class representing an unsigned DepositTx transaction.
 */
export class RegisterNodeTx extends BaseTx {
  protected _typeName = "RegisterNodeTx"
  protected _typeID = PlatformVMConstants.REGISTERNODETX

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      oldNodeID: bufferToNodeIDString(this.oldNodeID),
      newNodeID: bufferToNodeIDString(this.newNodeID),
      address: serialization.encoder(
        this.consortiumMemberAddress,
        encoding,
        "Buffer",
        "cb58"
      )
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.oldNodeID = NodeIDStringToBuffer(fields["oldNodeID"])
    this.newNodeID = NodeIDStringToBuffer(fields["newNodeID"])
    this.consortiumMemberAddress = serialization.decoder(
      fields["address"],
      encoding,
      "cb58",
      "Buffer",
      20
    )
  }

  // Node id that will be unregistered for consortium member
  protected oldNodeID: Buffer = Buffer.alloc(20)
  // Node id that will be registered for consortium member
  protected newNodeID: Buffer = Buffer.alloc(20)
  // Auth that will be used to verify credential for [ConsortiumMemberAddress].
  // If [ConsortiumMemberAddress] is msig-alias, auth must match real signatures.
  protected consortiumMemberAuth: SubnetAuth
  // Address of consortium member to which node id will be registered
  protected consortiumMemberAddress: Buffer = Buffer.alloc(20)
  // Signatures
  protected sigCount: Buffer = Buffer.alloc(4)
  protected sigIdxs: SigIdx[] = [] // idxs of subnet auth signers

  /**
   * Returns the id of the [[RegisterNodeTx]]
   */
  getTxType(): number {
    return PlatformVMConstants.REGISTERNODETX
  }

  getOldNodeID(): Buffer {
    return this.oldNodeID
  }

  getNewNodeID(): Buffer {
    return this.newNodeID
  }
  getConsortiumMemberAddress(): Buffer {
    return this.consortiumMemberAddress
  }

  /**
   * Returns the subnetAuth
   */
  getConsortiumMemberAuth(): SubnetAuth {
    return this.consortiumMemberAuth
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing a [[RegisterNodeTx]], parses it, populates the class, and returns the length of the [[RegisterNodeTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[RegisterNodeTx]]
   *
   * @returns The length of the raw [[RegisterNodeTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    this.oldNodeID = bintools.copyFrom(bytes, offset, offset + 20)
    offset += 20

    this.newNodeID = bintools.copyFrom(bytes, offset, offset + 20)
    offset += 20

    const sa: SubnetAuth = new SubnetAuth()
    offset += sa.fromBuffer(bintools.copyFrom(bytes, offset))
    this.consortiumMemberAuth = sa

    this.consortiumMemberAddress = bintools.copyFrom(bytes, offset, offset + 20)
    offset += 20

    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[RegisterNodeTx]].
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()

    let bsize: number =
      superbuff.length + this.oldNodeID.length + this.newNodeID.length

    const barr: Buffer[] = [superbuff, this.oldNodeID, this.newNodeID]

    bsize += this.consortiumMemberAuth.toBuffer().length
    barr.push(this.consortiumMemberAuth.toBuffer())

    bsize += this.consortiumMemberAddress.length
    barr.push(this.consortiumMemberAddress)

    return Buffer.concat(barr, bsize)
  }

  clone(): this {
    const newRegisterNodeTx: RegisterNodeTx = new RegisterNodeTx()
    newRegisterNodeTx.fromBuffer(this.toBuffer())
    return newRegisterNodeTx as this
  }

  create(...args: any[]): this {
    return new RegisterNodeTx(...args) as this
  }

  /**
   * Creates and adds a [[SigIdx]] to the [[AddRegisterNodeTx]].
   *
   * @param addressIdx The index of the address to reference in the signatures
   * @param address The address of the source of the signature
   */
  addSignatureIdx(addressIdx: number, address: Buffer): void {
    const addressIndex: Buffer = Buffer.alloc(4)
    addressIndex.writeUIntBE(addressIdx, 0, 4)
    this.consortiumMemberAuth.addAddressIndex(addressIndex)

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
   * Sets the array of [[SigIdx]] for this [[TX]]
   */
  setSigIdxs(sigIdxs: SigIdx[]) {
    this.sigIdxs = sigIdxs
    this.sigCount.writeUInt32BE(this.sigIdxs.length, 0)
    this.consortiumMemberAuth.setAddressIndices(
      sigIdxs.map((idx) => idx.toBuffer())
    )
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
    let cred: Credential = SelectCredentialClass(this.getCredentialID())

    function addSig(source: Buffer) {
      const keypair: KeyPair = kc.getKey(source)
      const signval: Buffer = keypair.sign(msg)
      const sig: Signature = new Signature()
      sig.fromBuffer(signval)
      cred.addSignature(sig)
    }

    // Add NodeSignature
    if (
      !this.newNodeID.every((v) => v === 0) &&
      this.oldNodeID.every((v) => v === 0)
    )
      addSig(this.newNodeID)
    creds.push(cred)

    cred = SelectCredentialClass(this.getCredentialID())
    const sigidxs: SigIdx[] = this.getSigIdxs()
    for (let i: number = 0; i < sigidxs.length; i++) {
      addSig(sigidxs[`${i}`].getSource())
    }
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
   * @param oldNodeID Optional ID of the existing NodeID to replace or remove.
   * @param newNodeID Optional ID of the newNodID to register address.
   * @param address The consortiumMemberAddress, single or multi-sig.
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    oldNodeID: Buffer = undefined,
    newNodeID: Buffer = undefined,
    address: Buffer = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)

    if (typeof oldNodeID !== "undefined") this.oldNodeID = oldNodeID

    if (typeof newNodeID !== "undefined") this.newNodeID = newNodeID

    if (typeof address != "undefined") {
      this.consortiumMemberAddress = address
    }
    this.consortiumMemberAuth = new SubnetAuth()
  }
}
