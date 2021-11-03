/**
 * @packageDocumentation
 * @module API-AVM-Vertex
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { AVMConstants } from "./constants"
import { TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { SelectCredentialClass } from "./credentials"
import { KeyChain, KeyPair } from "./keychain"
import { Signature, SigIdx, Credential } from "../../common/credentials"
import { DefaultNetworkID } from "../../utils/constants"
import { SelectTxClass } from "./tx"
import {
  Serializable,
  Serialization,
  SerializedEncoding,
  SerializedType
} from "../../utils/serialization"
import { CodecIdError } from "../../utils/errors"
import { Address } from "../../common"
import BN from "bn.js"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()
const decimalString: SerializedType = "decimalString"
const buffer: SerializedType = "Buffer"
const display: SerializedEncoding = "display"

/**
 * Class representing a Vertex
 */
export class Vertex extends Serializable {
  protected _typeName = "Vertex"
  protected _codecID = AVMConstants.LATESTCODEC

  //serialize is inherited

  // TODO - implement deserialize
  // deserialize(fields: object, encoding: SerializedEncoding = "hex") {
  //   super.deserialize(fields, encoding)
  //   this.outs = fields["outs"].map((o: TransferableOutput) => {
  //     let newOut: TransferableOutput = new TransferableOutput()
  //     newOut.deserialize(o, encoding)
  //     return newOut
  //   })
  //   this.ins = fields["ins"].map((i: TransferableInput) => {
  //     let newIn: TransferableInput = new TransferableInput()
  //     newIn.deserialize(i, encoding)
  //     return newIn
  //   })
  //   this.numouts = serialization.decoder(
  //     this.outs.length.toString(),
  //     display,
  //     decimalString,
  //     buffer,
  //     4
  //   )
  //   this.numins = serialization.decoder(
  //     this.ins.length.toString(),
  //     display,
  //     decimalString,
  //     buffer,
  //     4
  //   )
  // }

  protected chainID: Buffer = Buffer.alloc(32)
  protected height: Buffer = Buffer.alloc(8)
  protected epoch: Buffer = Buffer.alloc(4)
  protected numAddresses: Buffer = Buffer.alloc(4)
  protected addresses: Address[] = []
  protected numParentIDs: Buffer = Buffer.alloc(4)
  protected parentIDs: Address[] = []
  protected txs: Buffer = Buffer.alloc(4)
  protected numRestrictions: Buffer = Buffer.alloc(4)
  protected restrictions: Address[] = []

  /**
   * Returns the ChainID as a number
   */
  getChainID = (): number => this.chainID.readUInt32BE(0)

  /**
   * Returns the height as a {@link https://github.com/indutny/bn.js/|BN}.
   */
  getHeight = (): BN => bintools.fromBufferToBN(this.height)

  /**
   * Returns the epoch as a number.
   */
  getEpoch = (): number => this.epoch.readUInt32BE(0)

  /**
   * @returns An array of Addresses
   */
  getAddresses = (): Address[] => {
    return this.addresses
  }

  /**
   * @returns An array of Addresses
   */
  getParentIDs = (): Address[] => {
    return this.parentIDs
  }

  /**
   * Returns the TX count as a number.
   */
  getTxs = (): number => this.txs.readUInt32BE(0)

  /**
   * @returns An array of Addresses
   */
  getRestrictions = (): Address[] => {
    return this.restrictions
  }

  /**
   * Set the codecID
   *
   * @param codecID The codecID to set
   */
  setCodecID(codecID: number): void {
    if (codecID !== 0 && codecID !== 1) {
      /* istanbul ignore next */
      throw new CodecIdError(
        "Error - BaseTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    }
    this._codecID = codecID
    this._typeID =
      this._codecID === 0 ? AVMConstants.BASETX : AVMConstants.BASETX_CODECONE
  }

  /**
   * Returns the id of the [[BaseTx]]
   */
  getTxType = (): number => {
    return this._typeID
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[BaseTx]], parses it, populates the class, and returns the length of the BaseTx in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[BaseTx]]
   *
   * @returns The length of the raw [[BaseTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.chainID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    this.height = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8
    this.epoch = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    this.numAddresses = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const addressCount: number = this.numAddresses.readUInt32BE(0)
    this.addresses = []
    for (let i: number = 0; i < addressCount; i++) {
      const address: Address = new Address()
      offset = address.fromBuffer(bytes, offset)
      this.addresses.push(address)
    }
    this.numParentIDs = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const parentIDsCount: number = this.numParentIDs.readUInt32BE(0)
    this.parentIDs = []
    for (let i: number = 0; i < parentIDsCount; i++) {
      const address: Address = new Address()
      offset = address.fromBuffer(bytes, offset)
      this.parentIDs.push(address)
    }

    this.txs = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4

    this.numRestrictions = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const restrictionsCount: number = this.numRestrictions.readUInt32BE(0)
    this.restrictions = []
    for (let i: number = 0; i < restrictionsCount; i++) {
      const address: Address = new Address()
      offset = address.fromBuffer(bytes, offset)
      this.restrictions.push(address)
    }
    return offset
  }

  /**
   * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
   *
   * @param msg A Buffer for the [[UnsignedTx]]
   * @param kc An [[KeyChain]] used in signing
   *
   * @returns An array of [[Credential]]s
   */
  // sign(msg: Buffer, kc: KeyChain): Credential[] {
  //   const sigs: Credential[] = []
  //   for (let i: number = 0; i < this.ins.length; i++) {
  //     const cred: Credential = SelectCredentialClass(
  //       this.ins[`${i}`].getInput().getCredentialID()
  //     )
  //     const sigidxs: SigIdx[] = this.ins[`${i}`].getInput().getSigIdxs()
  //     for (let j: number = 0; j < sigidxs.length; j++) {
  //       const keypair: KeyPair = kc.getKey(sigidxs[`${j}`].getSource())
  //       const signval: Buffer = keypair.sign(msg)
  //       const sig: Signature = new Signature()
  //       sig.fromBuffer(signval)
  //       cred.addSignature(sig)
  //     }
  //     sigs.push(cred)
  //   }
  //   return sigs
  // }

  // clone(): this {
  //   let newbase: BaseTx = new BaseTx()
  //   newbase.fromBuffer(this.toBuffer())
  //   return newbase as this
  // }

  // create(...args: any[]): this {
  //   return new BaseTx(...args) as this
  // }

  // select(id: number, ...args: any[]): this {
  //   let newbasetx: BaseTx = SelectTxClass(id, ...args)
  //   return newbasetx as this
  // }

  /**
   * Class representing a BaseTx which is the foundation for all transactions.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param chainID Optional chainID, default Buffer.alloc(32, 16)
   */
  constructor(
    networkID: number = DefaultNetworkID,
    chainID: Buffer = Buffer.alloc(32),
    height: Buffer = Buffer.alloc(8),
    epoch: Buffer = Buffer.alloc(4),
    numAddresses: Buffer = Buffer.alloc(4),
    addresses: Address[] = [],
    numParentIDs: Buffer = Buffer.alloc(4),
    parentIDs: Address[] = [],
    txs: Buffer = Buffer.alloc(4),
    numRestrictions: Buffer = Buffer.alloc(4),
    restrictions: Address[] = []
  ) {
    super()
  }
}
