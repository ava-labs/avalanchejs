/**
 * @packageDocumentation
 * @module API-PlatformVM-CreateSubnetTx
 */
import { Buffer } from "buffer/"
import { BaseTx } from "./basetx"
import { PlatformVMConstants } from "./constants"
import { DefaultNetworkID } from "../../utils/constants"
import { TransferableOutput, SECPOwnerOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { SerializedEncoding } from "../../utils/serialization"
import { SubnetOwnerError } from "../../utils/errors"

export class CreateSubnetTx extends BaseTx {
  protected _typeName = "CreateSubnetTx"
  protected _typeID = PlatformVMConstants.CREATESUBNETTX

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      subnetOwners: this.subnetOwners.serialize(encoding)
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.subnetOwners = new SECPOwnerOutput()
    this.subnetOwners.deserialize(fields["subnetOwners"], encoding)
  }

  protected subnetOwners: SECPOwnerOutput = undefined

  /**
   * Returns the id of the [[CreateSubnetTx]]
   */
  getTxType(): number {
    return this._typeID
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} for the reward address.
   */
  getSubnetOwners(): SECPOwnerOutput {
    return this.subnetOwners
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[CreateSubnetTx]], parses it, populates the class, and returns the length of the [[CreateSubnetTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[CreateSubnetTx]]
   * @param offset A number for the starting position in the bytes.
   *
   * @returns The length of the raw [[CreateSubnetTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    offset += 4
    this.subnetOwners = new SECPOwnerOutput()
    offset = this.subnetOwners.fromBuffer(bytes, offset)
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateSubnetTx]].
   */
  toBuffer(): Buffer {
    if (
      typeof this.subnetOwners === "undefined" ||
      !(this.subnetOwners instanceof SECPOwnerOutput)
    ) {
      throw new SubnetOwnerError(
        "CreateSubnetTx.toBuffer -- this.subnetOwners is not a SECPOwnerOutput"
      )
    }
    let typeID: Buffer = Buffer.alloc(4)
    typeID.writeUInt32BE(this.subnetOwners.getOutputID(), 0)
    let barr: Buffer[] = [
      super.toBuffer(),
      typeID,
      this.subnetOwners.toBuffer()
    ]
    return Buffer.concat(barr)
  }

  /**
   * Class representing an unsigned Create Subnet transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param subnetOwners Optional [[SECPOwnerOutput]] class for specifying who owns the subnet.
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    subnetOwners: SECPOwnerOutput = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    this.subnetOwners = subnetOwners
  }
}
