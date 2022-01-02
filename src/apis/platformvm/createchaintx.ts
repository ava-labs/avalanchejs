/**
 * @packageDocumentation
 * @module API-PlatformVM-ExportTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import { TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { BaseTx } from "./basetx"
import { DefaultNetworkID } from "../../utils/constants"
import BN from "bn.js"
import { AmountOutput } from "../platformvm/outputs"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import { SubnetIdError, TransferableOutputError } from "../../utils/errors"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Class representing an unsigned CreateChainTx transaction.
 */
export class CreateChainTx extends BaseTx {
  protected _typeName = "CreateChainTx"
  protected _typeID = PlatformVMConstants.CREATECHAINTX

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      subnetID: serialization.encoder(
        this.subnetID,
        encoding,
        "Buffer",
        "cb58"
      ),
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

  protected subnetID: Buffer = Buffer.alloc(32)
  protected chainName: string = ""
  protected vmID: string = ""
  protected fxIDs: Buffer[] = []
  protected genesisData: Buffer = Buffer.alloc(32)

  /**
   * Returns the id of the [[ExportTx]]
   */
  getTxType = (): number => {
    return PlatformVMConstants.EXPORTTX
  }

  /**
   * Returns a string of the chainName
   */
  getChainName(): string {
    return this.chainName
  }

  /**
   * Returns the subnetID as a {@link https://github.com/feross/buffer|Buffer}
   */
  getSubnetID = (): Buffer => this.subnetID

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[ExportTx]], parses it, populates the class, and returns the length of the [[ExportTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ExportTx]]
   *
   * @returns The length of the raw [[ExportTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    this.subnetID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    // this.numOuts = bintools.copyFrom(bytes, offset, offset + 4)
    // offset += 4
    // const numOuts: number = this.numOuts.readUInt32BE(0)
    // for (let i: number = 0; i < numOuts; i++) {
    //   const anOut: TransferableOutput = new TransferableOutput()
    //   offset = anOut.fromBuffer(bytes, offset)
    //   this.exportOuts.push(anOut)
    // }
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ExportTx]].
   */
  toBuffer(): Buffer {
    if (typeof this.subnetID === "undefined") {
      throw new SubnetIdError(
        "CreateChainTx.toBuffer -- this.subnetID is undefined"
      )
    }
    // this.numOuts.writeUInt32BE(this.exportOuts.length, 0)
    let barr: Buffer[] = []
    // let barr: Buffer[] = [super.toBuffer(), this.subnetID, this.numOuts]
    // this.exportOuts = this.exportOuts.sort(TransferableOutput.comparator())
    // for (let i: number = 0; i < this.exportOuts.length; i++) {
    //   barr.push(this.exportOuts[`${i}`].toBuffer())
    // }
    return Buffer.concat(barr)
  }

  clone(): this {
    let newbase: CreateChainTx = new CreateChainTx()
    newbase.fromBuffer(this.toBuffer())
    return newbase as this
  }

  create(...args: any[]): this {
    return new CreateChainTx(...args) as this
  }

  /**
   * Class representing an unsigned Export transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param subnetID Optional ID of the Subnet that validates this blockchain.
   * @param chainName Optional A human readable name for the chain; need not be unique
   * @param vmID Optional ID of the VM running on the new chain
   * @param fxIDs Optional IDs of the feature extensions running on the new chain
   * @param genesisData Optional Byte representation of genesis state of the new chain
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    subnetID: Buffer = undefined,
    chainName: string = undefined,
    vmID: string = undefined,
    fxIDs: Buffer[] = undefined,
    genesisData: Buffer = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    if (typeof subnetID != "undefined") {
      this.subnetID = subnetID
    }
    if (typeof chainName != "undefined") {
      this.chainName = chainName
    }
    if (typeof vmID != "undefined") {
      this.vmID = vmID
    }
    if (typeof fxIDs != "undefined") {
      this.fxIDs = fxIDs
    }
    if (typeof genesisData != "undefined") {
      this.genesisData = genesisData
    }
  }
}
