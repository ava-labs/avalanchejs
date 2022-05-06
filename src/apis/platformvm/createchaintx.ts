/**
 * @packageDocumentation
 * @module API-PlatformVM-CreateChainTx
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
import { GenesisData } from "../avm"
import { SelectCredentialClass, SubnetAuth } from "."
import { KeyChain, KeyPair } from "./keychain"

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

  protected subnetID: Buffer = Buffer.alloc(32)
  protected chainName: string = ""
  protected vmID: Buffer = Buffer.alloc(32)
  protected numFXIDs: Buffer = Buffer.alloc(4)
  protected fxIDs: Buffer[] = []
  protected genesisData: Buffer = Buffer.alloc(32)
  protected subnetAuth: SubnetAuth
  protected sigCount: Buffer = Buffer.alloc(4)
  protected sigIdxs: SigIdx[] = [] // idxs of subnet auth signers

  /**
   * Returns the id of the [[CreateChainTx]]
   */
  getTxType(): number {
    return PlatformVMConstants.CREATECHAINTX
  }

  /**
   * Returns the subnetAuth
   */
  getSubnetAuth(): SubnetAuth {
    return this.subnetAuth
  }

  /**
   * Returns the subnetID as a string
   */
  getSubnetID(): string {
    return bintools.cb58Encode(this.subnetID)
  }

  /**
   * Returns a string of the chainName
   */
  getChainName(): string {
    return this.chainName
  }

  /**
   * Returns a Buffer of the vmID
   */
  getVMID(): Buffer {
    return this.vmID
  }

  /**
   * Returns an array of fxIDs as Buffers
   */
  getFXIDs(): Buffer[] {
    return this.fxIDs
  }

  /**
   * Returns a string of the genesisData
   */
  getGenesisData(): string {
    return bintools.cb58Encode(this.genesisData)
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[CreateChainTx]], parses it, populates the class, and returns the length of the [[CreateChainTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[CreateChainTx]]
   *
   * @returns The length of the raw [[CreateChainTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    this.subnetID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32

    const chainNameSize: number = bintools
      .copyFrom(bytes, offset, offset + 2)
      .readUInt16BE(0)
    offset += 2

    this.chainName = bintools
      .copyFrom(bytes, offset, offset + chainNameSize)
      .toString("utf8")
    offset += chainNameSize

    this.vmID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32

    this.numFXIDs = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4

    const nfxids: number = parseInt(this.numFXIDs.toString("hex"), 10)

    for (let i: number = 0; i < nfxids; i++) {
      this.fxIDs.push(bintools.copyFrom(bytes, offset, offset + 32))
      offset += 32
    }

    const genesisDataSize: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4

    this.genesisData = bintools.copyFrom(
      bytes,
      offset,
      offset + genesisDataSize
    )
    offset += genesisDataSize

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

    const chainNameBuff: Buffer = Buffer.alloc(this.chainName.length)
    chainNameBuff.write(this.chainName, 0, this.chainName.length, "utf8")
    const chainNameSize: Buffer = Buffer.alloc(2)
    chainNameSize.writeUIntBE(this.chainName.length, 0, 2)

    let bsize: number =
      superbuff.length +
      this.subnetID.length +
      chainNameSize.length +
      chainNameBuff.length +
      this.vmID.length +
      this.numFXIDs.length

    const barr: Buffer[] = [
      superbuff,
      this.subnetID,
      chainNameSize,
      chainNameBuff,
      this.vmID,
      this.numFXIDs
    ]

    this.fxIDs.forEach((fxID: Buffer): void => {
      bsize += fxID.length
      barr.push(fxID)
    })

    bsize += 4
    bsize += this.genesisData.length
    const gdLength: Buffer = Buffer.alloc(4)
    gdLength.writeUIntBE(this.genesisData.length, 0, 4)
    barr.push(gdLength)
    barr.push(this.genesisData)

    bsize += this.subnetAuth.toBuffer().length
    barr.push(this.subnetAuth.toBuffer())

    return Buffer.concat(barr, bsize)
  }

  clone(): this {
    const newCreateChainTx: CreateChainTx = new CreateChainTx()
    newCreateChainTx.fromBuffer(this.toBuffer())
    return newCreateChainTx as this
  }

  create(...args: any[]): this {
    return new CreateChainTx(...args) as this
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
   * Class representing an unsigned CreateChain transaction.
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
    subnetID: string | Buffer = undefined,
    chainName: string = undefined,
    vmID: string = undefined,
    fxIDs: string[] = undefined,
    genesisData: string | GenesisData = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    if (typeof subnetID != "undefined") {
      if (typeof subnetID === "string") {
        this.subnetID = bintools.cb58Decode(subnetID)
      } else {
        this.subnetID = subnetID
      }
    }
    if (typeof chainName != "undefined") {
      this.chainName = chainName
    }
    if (typeof vmID != "undefined") {
      const buf: Buffer = Buffer.alloc(32)
      buf.write(vmID, 0, vmID.length)
      this.vmID = buf
    }
    if (typeof fxIDs != "undefined") {
      this.numFXIDs.writeUInt32BE(fxIDs.length, 0)
      const fxIDBufs: Buffer[] = []
      fxIDs.forEach((fxID: string): void => {
        const buf: Buffer = Buffer.alloc(32)
        buf.write(fxID, 0, fxID.length, "utf8")
        fxIDBufs.push(buf)
      })
      this.fxIDs = fxIDBufs
    }
    if (typeof genesisData != "undefined" && typeof genesisData != "string") {
      this.genesisData = genesisData.toBuffer()
    } else if (typeof genesisData == "string") {
      this.genesisData = Buffer.from(genesisData)
    }

    const subnetAuth: SubnetAuth = new SubnetAuth()
    this.subnetAuth = subnetAuth
  }
}
