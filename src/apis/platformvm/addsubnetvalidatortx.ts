/**
 * @packageDocumentation
 * @module API-PlatformVM-AddSubnetValidatorTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import { TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { Credential, SigIdx, Signature } from "../../common/credentials"
import { BaseTx } from "./basetx"
import { DefaultNetworkID } from "../../utils/constants"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import { SelectCredentialClass, SubnetAuth } from "."
import { KeyChain, KeyPair } from "./keychain"
import BN from "bn.js"
import { bufferToNodeIDString } from "../../utils"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Class representing an unsigned AddSubnetValidatorTx transaction.
 */
export class AddSubnetValidatorTx extends BaseTx {
  protected _typeName = "AddSubnetValidatorTx"
  protected _typeID = PlatformVMConstants.ADDSUBNETVALIDATORTX

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      subnetID: serialization.encoder(this.subnetID, encoding, "Buffer", "cb58")
      // exportOuts: this.exportOuts.map((e) => e.serialize(encoding))
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.subnetID = serialization.decoder(
      fields["subnetID"],
      encoding,
      "cb58",
      "Buffer",
      32
    )
    // this.exportOuts = fields["exportOuts"].map((e: object) => {
    //   let eo: TransferableOutput = new TransferableOutput()
    //   eo.deserialize(e, encoding)
    //   return eo
    // })
  }

  protected nodeID: Buffer = Buffer.alloc(20)
  protected startTime: Buffer = Buffer.alloc(8)
  protected endTime: Buffer = Buffer.alloc(8)
  protected weight: Buffer = Buffer.alloc(8)
  protected subnetID: Buffer = Buffer.alloc(32)
  protected subnetAuth: SubnetAuth
  protected sigCount: Buffer = Buffer.alloc(4)
  protected sigIdxs: SigIdx[] = [] // idxs of subnet auth signers

  /**
   * Returns the id of the [[AddSubnetValidatorTx]]
   */
  getTxType(): number {
    return PlatformVMConstants.ADDSUBNETVALIDATORTX
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} for the stake amount.
   */
  getNodeID(): Buffer {
    return this.nodeID
  }

  /**
   * Returns a string for the nodeID amount.
   */
  getNodeIDString(): string {
    return bufferToNodeIDString(this.nodeID)
  }

  /**
   * Returns a {@link https://github.com/indutny/bn.js/|BN} for the startTime.
   */
  getStartTime(): BN {
    return bintools.fromBufferToBN(this.startTime)
  }

  /**
   * Returns a {@link https://github.com/indutny/bn.js/|BN} for the endTime.
   */
  getEndTime(): BN {
    return bintools.fromBufferToBN(this.endTime)
  }

  /**
   * Returns a {@link https://github.com/indutny/bn.js/|BN} for the weight
   */
  getWeight(): BN {
    return bintools.fromBufferToBN(this.weight)
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
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[AddSubnetValidatorTx]], parses it, populates the class, and returns the length of the [[CreateChainTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[AddSubnetValidatorTx]]
   *
   * @returns The length of the raw [[AddSubnetValidatorTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)

    this.nodeID = bintools.copyFrom(bytes, offset, offset + 20)
    offset += 20

    this.startTime = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8

    this.endTime = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8

    this.weight = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8

    this.subnetID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32

    const sa: SubnetAuth = new SubnetAuth()
    offset += sa.fromBuffer(bintools.copyFrom(bytes, offset))
    this.subnetAuth = sa

    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateChainTx]].
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()

    const bsize: number =
      superbuff.length +
      this.nodeID.length +
      this.startTime.length +
      this.endTime.length +
      this.weight.length +
      this.subnetID.length +
      this.subnetAuth.toBuffer().length

    const barr: Buffer[] = [
      superbuff,
      this.nodeID,
      this.startTime,
      this.endTime,
      this.weight,
      this.subnetID,
      this.subnetAuth.toBuffer()
    ]
    return Buffer.concat(barr, bsize)
  }

  clone(): this {
    const newAddSubnetValidatorTx: AddSubnetValidatorTx =
      new AddSubnetValidatorTx()
    newAddSubnetValidatorTx.fromBuffer(this.toBuffer())
    return newAddSubnetValidatorTx as this
  }

  create(...args: any[]): this {
    return new AddSubnetValidatorTx(...args) as this
  }

  /**
   * Creates and adds a [[SigIdx]] to the [[AddSubnetValidatorTx]].
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
   * Class representing an unsigned AddSubnetValidator transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param nodeID Optional. The node ID of the validator being added.
   * @param startTime Optional. The Unix time when the validator starts validating the Primary Network.
   * @param endTime Optional. The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
   * @param weight Optional. Weight of this validator used when sampling
   * @param subnetID Optional. ID of the subnet this validator is validating
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    nodeID: Buffer = undefined,
    startTime: BN = undefined,
    endTime: BN = undefined,
    weight: BN = undefined,
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
    if (typeof startTime != "undefined") {
      this.startTime = bintools.fromBNToBuffer(startTime, 8)
    }
    if (typeof endTime != "undefined") {
      this.endTime = bintools.fromBNToBuffer(endTime, 8)
    }
    if (typeof weight != "undefined") {
      this.weight = bintools.fromBNToBuffer(weight, 8)
    }

    const subnetAuth: SubnetAuth = new SubnetAuth()
    this.subnetAuth = subnetAuth
  }
}
