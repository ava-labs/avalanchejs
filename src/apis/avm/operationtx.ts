/**
 * @packageDocumentation
 * @module API-AVM-OperationTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { AVMConstants } from "./constants"
import { TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { TransferableOperation } from "./ops"
import { SelectCredentialClass } from "./credentials"
import { KeyChain, KeyPair } from "./keychain"
import { Signature, SigIdx, Credential } from "../../common/credentials"
import { BaseTx } from "./basetx"
import { DefaultNetworkID } from "../../utils/constants"
import { SerializedEncoding } from "../../utils/serialization"
import { CodecIdError, OperationError } from "../../utils/errors"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

/**
 * Class representing an unsigned Operation transaction.
 */
export class OperationTx extends BaseTx {
  protected _typeName = "OperationTx"
  protected _codecID = AVMConstants.LATESTCODEC
  protected _typeID =
    this._codecID === 0
      ? AVMConstants.OPERATIONTX
      : AVMConstants.OPERATIONTX_CODECONE

  serialize(encoding: SerializedEncoding = "hex"): object {
    const fields: object = super.serialize(encoding)
    return {
      ...fields,
      ops: this.ops.map((o) => o.serialize(encoding))
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.ops = fields["ops"].map((o: object) => {
      let op: TransferableOperation = new TransferableOperation()
      op.deserialize(o, encoding)
      return op
    })
    this.numOps = Buffer.alloc(4)
    this.numOps.writeUInt32BE(this.ops.length, 0)
  }

  protected numOps: Buffer = Buffer.alloc(4)
  protected ops: TransferableOperation[] = []

  setCodecID(codecID: number): void {
    if (codecID !== 0 && codecID !== 1) {
      /* istanbul ignore next */
      throw new CodecIdError(
        "Error - OperationTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1."
      )
    }
    this._codecID = codecID
    this._typeID =
      this._codecID === 0
        ? AVMConstants.OPERATIONTX
        : AVMConstants.OPERATIONTX_CODECONE
  }

  /**
   * Returns the id of the [[OperationTx]]
   */
  getTxType(): number {
    return this._typeID
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[OperationTx]], parses it, populates the class, and returns the length of the [[OperationTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[OperationTx]]
   *
   * @returns The length of the raw [[OperationTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    this.numOps = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const numOps: number = this.numOps.readUInt32BE(0)
    for (let i: number = 0; i < numOps; i++) {
      const op: TransferableOperation = new TransferableOperation()
      offset = op.fromBuffer(bytes, offset)
      this.ops.push(op)
    }
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[OperationTx]].
   */
  toBuffer(): Buffer {
    this.numOps.writeUInt32BE(this.ops.length, 0)
    let barr: Buffer[] = [super.toBuffer(), this.numOps]
    this.ops = this.ops.sort(TransferableOperation.comparator())
    for (let i: number = 0; i < this.ops.length; i++) {
      barr.push(this.ops[`${i}`].toBuffer())
    }
    return Buffer.concat(barr)
  }

  /**
   * Returns an array of [[TransferableOperation]]s in this transaction.
   */
  getOperations(): TransferableOperation[] {
    return this.ops
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
    for (let i: number = 0; i < this.ops.length; i++) {
      const cred: Credential = SelectCredentialClass(
        this.ops[`${i}`].getOperation().getCredentialID()
      )
      const sigidxs: SigIdx[] = this.ops[`${i}`].getOperation().getSigIdxs()
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
    const newbase: OperationTx = new OperationTx()
    newbase.fromBuffer(this.toBuffer())
    return newbase as this
  }

  create(...args: any[]): this {
    return new OperationTx(...args) as this
  }

  /**
   * Class representing an unsigned Operation transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param ops Array of [[Operation]]s used in the transaction
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    ops: TransferableOperation[] = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    if (typeof ops !== "undefined" && Array.isArray(ops)) {
      for (let i: number = 0; i < ops.length; i++) {
        if (!(ops[`${i}`] instanceof TransferableOperation)) {
          throw new OperationError(
            `Error - OperationTx.constructor: invalid op in array parameter ${ops}`
          )
        }
      }
      this.ops = ops
    }
  }
}
