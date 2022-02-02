/**
 * @packageDocumentation
 * @module Common-Inputs
 */
import { Buffer } from "buffer/"
import BinTools from "../utils/bintools"
import BN from "bn.js"
import { SigIdx } from "./credentials"
import {
  Serializable,
  Serialization,
  SerializedEncoding
} from "../utils/serialization"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

export abstract class Input extends Serializable {
  protected _typeName = "Input"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      sigIdxs: this.sigIdxs.map((s) => s.serialize(encoding))
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.sigIdxs = fields["sigIdxs"].map((s: object) => {
      let sidx: SigIdx = new SigIdx()
      sidx.deserialize(s, encoding)
      return sidx
    })
    this.sigCount.writeUInt32BE(this.sigIdxs.length, 0)
  }

  protected sigCount: Buffer = Buffer.alloc(4)
  protected sigIdxs: SigIdx[] = [] // idxs of signers from utxo

  static comparator =
    (): ((a: Input, b: Input) => 1 | -1 | 0) =>
    (a: Input, b: Input): 1 | -1 | 0 => {
      const aoutid: Buffer = Buffer.alloc(4)
      aoutid.writeUInt32BE(a.getInputID(), 0)
      const abuff: Buffer = a.toBuffer()

      const boutid: Buffer = Buffer.alloc(4)
      boutid.writeUInt32BE(b.getInputID(), 0)
      const bbuff: Buffer = b.toBuffer()

      const asort: Buffer = Buffer.concat(
        [aoutid, abuff],
        aoutid.length + abuff.length
      )
      const bsort: Buffer = Buffer.concat(
        [boutid, bbuff],
        boutid.length + bbuff.length
      )
      return Buffer.compare(asort, bsort) as 1 | -1 | 0
    }

  abstract getInputID(): number

  /**
   * Returns the array of [[SigIdx]] for this [[Input]]
   */
  getSigIdxs = (): SigIdx[] => this.sigIdxs

  abstract getCredentialID(): number

  /**
   * Creates and adds a [[SigIdx]] to the [[Input]].
   *
   * @param addressIdx The index of the address to reference in the signatures
   * @param address The address of the source of the signature
   */
  addSignatureIdx = (addressIdx: number, address: Buffer) => {
    const sigidx: SigIdx = new SigIdx()
    const b: Buffer = Buffer.alloc(4)
    b.writeUInt32BE(addressIdx, 0)
    sigidx.fromBuffer(b)
    sigidx.setSource(address)
    this.sigIdxs.push(sigidx)
    this.sigCount.writeUInt32BE(this.sigIdxs.length, 0)
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.sigCount = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const sigCount: number = this.sigCount.readUInt32BE(0)
    this.sigIdxs = []
    for (let i: number = 0; i < sigCount; i++) {
      const sigidx = new SigIdx()
      const sigbuff: Buffer = bintools.copyFrom(bytes, offset, offset + 4)
      sigidx.fromBuffer(sigbuff)
      offset += 4
      this.sigIdxs.push(sigidx)
    }
    return offset
  }

  toBuffer(): Buffer {
    this.sigCount.writeUInt32BE(this.sigIdxs.length, 0)
    let bsize: number = this.sigCount.length
    const barr: Buffer[] = [this.sigCount]
    for (let i: number = 0; i < this.sigIdxs.length; i++) {
      const b: Buffer = this.sigIdxs[`${i}`].toBuffer()
      barr.push(b)
      bsize += b.length
    }
    return Buffer.concat(barr, bsize)
  }

  /**
   * Returns a base-58 representation of the [[Input]].
   */
  toString(): string {
    return bintools.bufferToB58(this.toBuffer())
  }

  abstract clone(): this

  abstract create(...args: any[]): this

  abstract select(id: number, ...args: any[]): Input
}

export abstract class StandardParseableInput extends Serializable {
  protected _typeName = "StandardParseableInput"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      input: this.input.serialize(encoding)
    }
  }

  protected input: Input

  /**
   * Returns a function used to sort an array of [[StandardParseableInput]]s
   */
  static comparator =
    (): ((
      a: StandardParseableInput,
      b: StandardParseableInput
    ) => 1 | -1 | 0) =>
    (a: StandardParseableInput, b: StandardParseableInput): 1 | -1 | 0 => {
      const sorta = a.toBuffer()
      const sortb = b.toBuffer()
      return Buffer.compare(sorta, sortb) as 1 | -1 | 0
    }

  getInput = (): Input => this.input

  // must be implemented to select input types for the VM in question
  abstract fromBuffer(bytes: Buffer, offset?: number): number

  toBuffer(): Buffer {
    const inbuff: Buffer = this.input.toBuffer()
    const inid: Buffer = Buffer.alloc(4)
    inid.writeUInt32BE(this.input.getInputID(), 0)
    const barr: Buffer[] = [inid, inbuff]
    return Buffer.concat(barr, inid.length + inbuff.length)
  }

  /**
   * Class representing an [[StandardParseableInput]] for a transaction.
   *
   * @param input A number representing the InputID of the [[StandardParseableInput]]
   */
  constructor(input: Input = undefined) {
    super()
    if (input instanceof Input) {
      this.input = input
    }
  }
}

export abstract class StandardTransferableInput extends StandardParseableInput {
  protected _typeName = "StandardTransferableInput"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      txid: serialization.encoder(this.txid, encoding, "Buffer", "cb58"),
      outputidx: serialization.encoder(
        this.outputidx,
        encoding,
        "Buffer",
        "decimalString"
      ),
      assetID: serialization.encoder(this.assetID, encoding, "Buffer", "cb58")
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.txid = serialization.decoder(
      fields["txid"],
      encoding,
      "cb58",
      "Buffer",
      32
    )
    this.outputidx = serialization.decoder(
      fields["outputidx"],
      encoding,
      "decimalString",
      "Buffer",
      4
    )
    this.assetID = serialization.decoder(
      fields["assetID"],
      encoding,
      "cb58",
      "Buffer",
      32
    )
    //input deserialization must be implmented in child classes
  }

  protected txid: Buffer = Buffer.alloc(32)
  protected outputidx: Buffer = Buffer.alloc(4)
  protected assetID: Buffer = Buffer.alloc(32)

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} of the TxID.
   */
  getTxID = (): /* istanbul ignore next */ Buffer => this.txid

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer}  of the OutputIdx.
   */
  getOutputIdx = (): /* istanbul ignore next */ Buffer => this.outputidx

  /**
   * Returns a base-58 string representation of the UTXOID this [[StandardTransferableInput]] references.
   */
  getUTXOID = (): string =>
    bintools.bufferToB58(Buffer.concat([this.txid, this.outputidx]))

  /**
   * Returns the input.
   */
  getInput = (): Input => this.input

  /**
   * Returns the assetID of the input.
   */
  getAssetID = (): Buffer => this.assetID

  abstract fromBuffer(bytes: Buffer, offset?: number): number

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardTransferableInput]].
   */
  toBuffer(): Buffer {
    const parseableBuff: Buffer = super.toBuffer()
    const bsize: number =
      this.txid.length +
      this.outputidx.length +
      this.assetID.length +
      parseableBuff.length
    const barr: Buffer[] = [
      this.txid,
      this.outputidx,
      this.assetID,
      parseableBuff
    ]
    const buff: Buffer = Buffer.concat(barr, bsize)
    return buff
  }

  /**
   * Returns a base-58 representation of the [[StandardTransferableInput]].
   */
  toString(): string {
    /* istanbul ignore next */
    return bintools.bufferToB58(this.toBuffer())
  }

  /**
   * Class representing an [[StandardTransferableInput]] for a transaction.
   *
   * @param txid A {@link https://github.com/feross/buffer|Buffer} containing the transaction ID of the referenced UTXO
   * @param outputidx A {@link https://github.com/feross/buffer|Buffer} containing the index of the output in the transaction consumed in the [[StandardTransferableInput]]
   * @param assetID A {@link https://github.com/feross/buffer|Buffer} representing the assetID of the [[Input]]
   * @param input An [[Input]] to be made transferable
   */
  constructor(
    txid: Buffer = undefined,
    outputidx: Buffer = undefined,
    assetID: Buffer = undefined,
    input: Input = undefined
  ) {
    super()
    if (
      typeof txid !== "undefined" &&
      typeof outputidx !== "undefined" &&
      typeof assetID !== "undefined" &&
      input instanceof Input
    ) {
      this.input = input
      this.txid = txid
      this.outputidx = outputidx
      this.assetID = assetID
    }
  }
}

/**
 * An [[Input]] class which specifies a token amount .
 */
export abstract class StandardAmountInput extends Input {
  protected _typeName = "StandardAmountInput"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      amount: serialization.encoder(
        this.amount,
        encoding,
        "Buffer",
        "decimalString",
        8
      )
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.amount = serialization.decoder(
      fields["amount"],
      encoding,
      "decimalString",
      "Buffer",
      8
    )
    this.amountValue = bintools.fromBufferToBN(this.amount)
  }

  protected amount: Buffer = Buffer.alloc(8)
  protected amountValue: BN = new BN(0)

  /**
   * Returns the amount as a {@link https://github.com/indutny/bn.js/|BN}.
   */
  getAmount = (): BN => this.amountValue.clone()

  /**
   * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[AmountInput]] and returns the size of the input.
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.amount = bintools.copyFrom(bytes, offset, offset + 8)
    this.amountValue = bintools.fromBufferToBN(this.amount)
    offset += 8
    return super.fromBuffer(bytes, offset)
  }

  /**
   * Returns the buffer representing the [[AmountInput]] instance.
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()
    const bsize: number = this.amount.length + superbuff.length
    const barr: Buffer[] = [this.amount, superbuff]
    return Buffer.concat(barr, bsize)
  }

  /**
   * An [[AmountInput]] class which issues a payment on an assetID.
   *
   * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the input
   */
  constructor(amount: BN = undefined) {
    super()
    if (amount) {
      this.amountValue = amount.clone()
      this.amount = bintools.fromBNToBuffer(amount, 8)
    }
  }
}
