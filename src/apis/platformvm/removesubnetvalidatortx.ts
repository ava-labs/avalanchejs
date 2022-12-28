/**
 * @packageDocumentation
 * @module API-PlatformVM-RemoveSubnetValidatorTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import { TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { Credential, SigIdx, Signature } from "../../common/credentials"
import { BaseTx } from "./basetx"
import { DefaultNetworkID } from "../../utils/constants"
import { SelectCredentialClass, SubnetAuth } from "."
import { KeyChain, KeyPair } from "./keychain"
import { bufferToNodeIDString } from "../../utils"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

/**
 * Class representing an unsigned RemoveSubnetValidatorTx transaction.
 */
export class RemoveSubnetValidatorTx extends BaseTx {
  protected _typeName = "RemoveSubnetValidatorTx"
  protected _typeID = PlatformVMConstants.REMOVESUBNETVALIDATORTX
  protected nodeID: Buffer = Buffer.alloc(20)
  protected subnetID: Buffer = Buffer.alloc(32)
  protected subnetAuth: SubnetAuth
  protected sigCount: Buffer = Buffer.alloc(4)
  protected sigIdxs: SigIdx[] = [] // idxs of subnet auth signers

  /**
   * Returns the id of the [[RemoveSubnetValidatorTx]]
   */
  getTxType(): number {
    return PlatformVMConstants.REMOVESUBNETVALIDATORTX
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} for the nodeID.
   */
  getNodeID(): Buffer {
    return this.nodeID
  }

  /**
   * Returns a string for the nodeID.
   */
  getNodeIDString(): string {
    return bufferToNodeIDString(this.nodeID)
  }

  /**
   * Returns the subnetID as a string
   */
  getSubnetID(): string {
    return bintools.cb58Encode(this.subnetID)
  }
  /**
   * Returns the subnetAuth
   */
  getSubnetAuth(): SubnetAuth {
    return this.subnetAuth
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[RemoveSubnetValidatorTx]], parses it, populates the class, and returns the length of the [[RemoveSubnetValidatorTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[RemoveSubnetValidatorTx]]
   *
   * @returns The length of the raw [[RemoveSubnetValidatorTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)

    this.nodeID = bintools.copyFrom(bytes, offset, offset + 20)
    offset += 20

    this.subnetID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32

    const sa: SubnetAuth = new SubnetAuth()
    offset += sa.fromBuffer(bintools.copyFrom(bytes, offset))
    this.subnetAuth = sa

    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[RemoveSubnetValidatorTx]].
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()

    const bsize: number =
      superbuff.length +
      this.nodeID.length +
      this.subnetID.length +
      this.subnetAuth.toBuffer().length

    const barr: Buffer[] = [
      superbuff,
      this.nodeID,
      this.subnetID,
      this.subnetAuth.toBuffer()
    ]
    return Buffer.concat(barr, bsize)
  }

  clone(): this {
    const newRemoveSubnetValidatorTx: RemoveSubnetValidatorTx =
      new RemoveSubnetValidatorTx()
    newRemoveSubnetValidatorTx.fromBuffer(this.toBuffer())
    return newRemoveSubnetValidatorTx as this
  }

  create(...args: any[]): this {
    return new RemoveSubnetValidatorTx(...args) as this
  }

  /**
   * Creates and adds a [[SigIdx]] to the [[RemoveSubnetValidatorTx]].
   *
   * @param addressIdx The index of the address to reference in the signatures
   * @param address The address of the source of the signature
   */
  addSignatureIdx(addressIdx: number, address: Buffer): void {
    const addressIndex: Buffer = Buffer.alloc(4)
    addressIndex.writeUIntBE(addressIdx, 0, 4)
    this.subnetAuth.addAddressIndex(addressIndex)

    const sigidx: SigIdx = new SigIdx()
    const b: Buffer = Buffer.alloc(4)
    b.writeUInt32BE(addressIdx, 0)
    sigidx.fromBuffer(b)
    sigidx.setSource(address)
    this.sigIdxs.push(sigidx)
    this.sigCount.writeUInt32BE(this.sigIdxs.length, 0)
  }

  /**
   * Returns the array of [[SigIdx]] for this [[Input]]
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
    const sigidxs: SigIdx[] = this.getSigIdxs()
    const cred: Credential = SelectCredentialClass(this.getCredentialID())
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

  /**
   * Class representing an unsigned RemoveSubnetValidatorTx transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param nodeID Optional. The node ID of the validator being added.
   * @param subnetID Optional. ID of the subnet this validator is validating
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    nodeID: Buffer = undefined,
    subnetID: string | Buffer = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    if (typeof subnetID != "undefined") {
      if (typeof subnetID === "string") {
        this.subnetID = bintools.cb58Decode(subnetID)
      } else {
        this.subnetID = subnetID
      }
    }
    if (typeof nodeID != "undefined") {
      this.nodeID = nodeID
    }

    const subnetAuth: SubnetAuth = new SubnetAuth()
    this.subnetAuth = subnetAuth
  }
}
