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
import { SelectTxClass, UnsignedTx } from "./tx"
import {
  Serializable,
  Serialization,
  SerializedEncoding,
  SerializedType
} from "../../utils/serialization"
import { CodecIdError } from "../../utils/errors"
import { Address } from "../../common"
import BN from "bn.js"
import { BaseTx } from "."
import { Output, OutputOwners } from "../../common/output"

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
  protected out: TransferableOutput = new TransferableOutput()
  protected ins: TransferableInput = new TransferableInput()
  protected numouts: TransferableOutput = new TransferableOutput()
  protected numins: TransferableInput = new TransferableInput()

  // serialize is inherited

  // TODO - implement deserialize
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.out = fields["outs"].map((o: TransferableOutput) => {
      let newOut: TransferableOutput = new TransferableOutput()
      newOut.deserialize(o, encoding)
      return newOut
    })
    this.ins = fields["ins"].map((i: TransferableInput) => {
      let newIn: TransferableInput = new TransferableInput()
      newIn.deserialize(i, encoding)
      return newIn
    })
    // this.numouts = serialization.decoder(
    //   this.out.length.toString(),
    //   display,
    //   decimalString,
    //   buffer,
    //   4
    // )
    // this.numins = serialization.decoder(
    //   this.ins.length.toString(),
    //   display,
    //   decimalString,
    //   buffer,
    //   4
    // )
  }
  protected chainID: Buffer = Buffer.alloc(32)
  protected height: Buffer = Buffer.alloc(8)
  protected epoch: Buffer = Buffer.alloc(4)
  protected numParentIDs: Buffer = Buffer.alloc(4)
  protected parentIDs: Buffer[] = []
  protected numTxs: Buffer = Buffer.alloc(4)
  protected txs: BaseTx[] = []
  protected numRestrictions: Buffer = Buffer.alloc(4)
  protected restrictions: Buffer[] = []

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
   * @returns An array of Buffers
   */
  getParentIDs = (): Buffer[] => {
    return this.parentIDs
  }

  /**
   * Returns array of UnsignedTxs.
   */
  getTxs = (): BaseTx[] => {
    return this.txs
  }

  /**
   * @returns An array of Buffers
   */
  getRestrictions = (): Buffer[] => {
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
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[BaseTx]], parses it, populates the class, and returns the length of the BaseTx in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[BaseTx]]
   *
   * @returns The length of the raw [[BaseTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset += 2
    this.chainID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    this.height = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8
    this.epoch = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    this.numParentIDs = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const parentIDsCount: number = this.numParentIDs.readUInt32BE(0)
    for (let i: number = 0; i < parentIDsCount; i++) {
      const parentID: Buffer = bintools.copyFrom(bytes, offset, offset + 32)
      offset += 32
      this.parentIDs.push(parentID)
    }

    this.numTxs = bintools.copyFrom(bytes, offset, offset + 4)
    const txsCount: number = this.numTxs.readUInt32BE(0)
    offset += 4
    // TODO - why do we have these 4 mystery bytes?
    offset += 4
    for (let i: number = 0; i < txsCount; i++) {
      const unsignedTx: UnsignedTx = new UnsignedTx()
      offset += unsignedTx.fromBuffer(bintools.copyFrom(bytes, offset))
      this.txs.push(unsignedTx.getTransaction())
    }

    this.numRestrictions = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const restrictionsCount: number = this.numRestrictions.readUInt32BE(0)
    for (let i: number = 0; i < restrictionsCount; i++) {
      const tx: Buffer = bintools.copyFrom(bytes, offset, offset + 32)
      offset += 32
      this.restrictions.push(tx)
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
    parentIDs: Address[] = [],
    txs: Buffer = Buffer.alloc(4),
    numRestrictions: Buffer = Buffer.alloc(4),
    restrictions: Address[] = []
  ) {
    super()
  }
}
