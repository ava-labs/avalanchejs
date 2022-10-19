/**
 * @packageDocumentation
 * @module API-PlatformVM-BaseTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import { TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { SelectCredentialClass } from "./credentials"
import { KeyChain, KeyPair } from "./keychain"
import { StandardBaseTx } from "../../common/tx"
import { Signature, SigIdx, Credential } from "../../common/credentials"
import { DefaultNetworkID } from "../../utils/constants"
import { SelectTxClass } from "../platformvm/tx"
import { SerializedEncoding } from "../../utils/serialization"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

/**
 * Class representing a base for all transactions.
 */
export class BaseTx extends StandardBaseTx<KeyPair, KeyChain> {
  protected _typeName = "BaseTx"
  protected _typeID = PlatformVMConstants.CREATESUBNETTX

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.outs = fields["outs"].map((o: TransferableOutput) => {
      let newOut: TransferableOutput = new TransferableOutput()
      newOut.deserialize(o, encoding)
      return newOut
    })
    this.ins = fields["ins"].map((i: TransferableInput) => {
      let newIn: TransferableInput = new TransferableInput()
      newIn.deserialize(i, encoding)
      return newIn
    })
    this.numouts = Buffer.alloc(4)
    this.numouts.writeUInt32BE(this.outs.length, 0)
    this.numins = Buffer.alloc(4)
    this.numins.writeUInt32BE(this.ins.length, 0)
  }

  getOuts(): TransferableOutput[] {
    return this.outs as TransferableOutput[]
  }

  getIns(): TransferableInput[] {
    return this.ins as TransferableInput[]
  }

  getTotalOuts(): TransferableOutput[] {
    return this.getOuts() as TransferableOutput[]
  }

  /**
   * Returns the id of the [[BaseTx]]
   */
  getTxType(): number {
    return PlatformVMConstants.BASETX
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
    this.networkID = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    this.blockchainID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    this.numouts = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const outcount: number = this.numouts.readUInt32BE(0)
    this.outs = []
    for (let i: number = 0; i < outcount; i++) {
      const xferout: TransferableOutput = new TransferableOutput()
      offset = xferout.fromBuffer(bytes, offset)
      this.outs.push(xferout)
    }

    this.numins = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const incount: number = this.numins.readUInt32BE(0)
    this.ins = []
    for (let i: number = 0; i < incount; i++) {
      const xferin: TransferableInput = new TransferableInput()
      offset = xferin.fromBuffer(bytes, offset)
      this.ins.push(xferin)
    }
    let memolen: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.memo = bintools.copyFrom(bytes, offset, offset + memolen)
    offset += memolen
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
  sign(msg: Buffer, kc: KeyChain): Credential[] {
    const creds: Credential[] = []
    for (let i: number = 0; i < this.ins.length; i++) {
      const cred: Credential = SelectCredentialClass(
        this.ins[`${i}`].getInput().getCredentialID()
      )
      const sigidxs: SigIdx[] = this.ins[`${i}`].getInput().getSigIdxs()
      for (let j: number = 0; j < sigidxs.length; j++) {
        const keypair: KeyPair = kc.getKey(sigidxs[`${j}`].getSource())
        const signval: Buffer = keypair.sign(msg)
        const sig: Signature = new Signature()
        sig.fromBuffer(signval)
        cred.addSignature(sig)
      }
      creds.push(cred)
    }
    return creds
  }

  clone(): this {
    let newbase: BaseTx = new BaseTx()
    newbase.fromBuffer(this.toBuffer())
    return newbase as this
  }

  create(...args: any[]): this {
    return new BaseTx(...args) as this
  }

  select(id: number, ...args: any[]): this {
    let newbasetx: BaseTx = SelectTxClass(id, ...args)
    return newbasetx as this
  }

  /**
   * Class representing a BaseTx which is the foundation for all transactions.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
  }
}
