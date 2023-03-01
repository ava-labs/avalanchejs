/**
 * @packageDocumentation
 * @module API-PlatformVM-Outputs
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import {
  BaseOutput,
  Output,
  StandardAmountOutput,
  StandardTransferableOutput,
  StandardParseableOutput
} from "../../common/output"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import BN from "bn.js"
import { OutputIdError } from "../../utils/errors"
import { LockedIDs } from "./locked"

const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Takes a buffer representing the output and returns the proper Output instance.
 *
 * @param outputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Output]]-extended class.
 */
export const SelectOutputClass = (
  outputid: number,
  ...args: any[]
): BaseOutput => {
  if (outputid == PlatformVMConstants.SECPXFEROUTPUTID) {
    return new SECPTransferOutput(...args)
  } else if (outputid == PlatformVMConstants.SECPOWNEROUTPUTID) {
    return new SECPOwnerOutput(...args)
  } else if (outputid == PlatformVMConstants.STAKEABLELOCKOUTID) {
    return new StakeableLockOut(...args)
  } else if (outputid == PlatformVMConstants.LOCKEDOUTID) {
    return new LockedOut(...args)
  }
  throw new OutputIdError(
    "Error - SelectOutputClass: unknown outputid " + outputid
  )
}

export class TransferableOutput extends StandardTransferableOutput {
  protected _typeName = "TransferableOutput"
  protected _typeID = undefined

  //serialize is inherited

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.output = SelectOutputClass(fields["output"]["_typeID"])
    this.output.deserialize(fields["output"], encoding)
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.assetID = bintools.copyFrom(
      bytes,
      offset,
      offset + PlatformVMConstants.ASSETIDLEN
    )
    offset += PlatformVMConstants.ASSETIDLEN
    const outputid: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.output = SelectOutputClass(outputid)
    return this.output.fromBuffer(bytes, offset)
  }

  static fromArray(b: Buffer): TransferableOutput[] {
    let offset = 6 //version + counter
    let num = b.readUInt32BE(2)
    const result: TransferableOutput[] = []
    while (offset < b.length && num-- > 0) {
      const t = new TransferableOutput()
      offset = t.fromBuffer(b, offset)
      result.push(t)
    }
    return result
  }
}

export class ParseableOutput extends StandardParseableOutput {
  protected _typeName = "ParseableOutput"
  protected _typeID = undefined

  //serialize is inherited

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.output = SelectOutputClass(fields["output"]["_typeID"])
    this.output.deserialize(fields["output"], encoding)
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    const outputid: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.output = SelectOutputClass(outputid)
    return this.output.fromBuffer(bytes, offset)
  }
}

export abstract class AmountOutput extends StandardAmountOutput {
  protected _typeName = "AmountOutput"
  protected _typeID = undefined

  //serialize and deserialize both are inherited

  /**
   * @param assetID An assetID which is wrapped around the Buffer of the Output
   */
  makeTransferable(assetID: Buffer): TransferableOutput {
    return new TransferableOutput(assetID, this)
  }
}

/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
export class SECPTransferOutput extends AmountOutput {
  protected _typeName = "SECPTransferOutput"
  protected _typeID = PlatformVMConstants.SECPXFEROUTPUTID

  //serialize and deserialize both are inherited

  /**
   * Returns the outputID for this output
   */
  getOutputID(): number {
    return this._typeID
  }

  create(...args: any[]): this {
    return new SECPTransferOutput(...args) as this
  }

  clone(): this {
    const newout: SECPTransferOutput = this.create()
    newout.fromBuffer(this.toBuffer())
    return newout as this
  }
}

/**
 * An [[Output]] class which specifies an output that has a locktime which can also enable
 * staking of the value held, preventing transfers but not validation.
 */
export class StakeableLockOut extends ParseableOutput {
  protected _typeName = "StakeableLockOut"
  protected _typeID = PlatformVMConstants.STAKEABLELOCKOUTID

  //serialize and deserialize both are inherited
  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    let outobj: object = {
      ...fields,
      stakeableLocktime: serialization.encoder(
        this.stakeableLocktime,
        encoding,
        "Buffer",
        "decimalString",
        8
      )
    }
    return outobj
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.stakeableLocktime = serialization.decoder(
      fields["stakeableLocktime"],
      encoding,
      "decimalString",
      "Buffer",
      8
    )
  }

  protected stakeableLocktime: Buffer

  getStakeableLocktime(): BN {
    return bintools.fromBufferToBN(this.stakeableLocktime)
  }

  /**
   * @param assetID An assetID which is wrapped around the Buffer of the Output
   */
  makeTransferable(assetID: Buffer): TransferableOutput {
    return new TransferableOutput(assetID, this)
  }

  /**
   * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[StakeableLockOut]] and returns the size of the output.
   */
  fromBuffer(outbuff: Buffer, offset: number = 0): number {
    this.stakeableLocktime = bintools.copyFrom(outbuff, offset, offset + 8)
    offset += 8
    offset = super.fromBuffer(outbuff, offset)
    return offset
  }

  /**
   * Returns the buffer representing the [[StakeableLockOut]] instance.
   */
  toBuffer(): Buffer {
    const superBuf = super.toBuffer()
    return Buffer.concat(
      [this.stakeableLocktime, superBuf],
      superBuf.length + 8
    )
  }

  /**
   * Returns the outputID for this output
   */
  getOutputID(): number {
    return this._typeID
  }

  create(...args: any[]): this {
    return new StakeableLockOut(...args) as this
  }

  clone(): this {
    const newout: StakeableLockOut = this.create()
    newout.fromBuffer(this.toBuffer())
    return newout as this
  }

  /**
   * Returns the amount from the underlying output
   */
  getAmount(): BN {
    return (this.getOutput() as StandardAmountOutput).getAmount()
  }

  /**
   * Backwards compatibility
   */
  getTransferableOutput(): ParseableOutput {
    return this
  }

  /**
   * A [[Output]] class which specifies a [[ParseableOutput]] that has a locktime which can also
   * enable staking of the value held, preventing transfers but not validation.
   *
   * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the output
   * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
   * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
   * @param threshold A number representing the the threshold number of signers required to sign the transaction
   * @param stakeableLocktime A {@link https://github.com/indutny/bn.js/|BN} representing the stakeable locktime
   * @param output A [[BaseOutput]] which is embedded into this output.
   */
  constructor(
    amount: BN = undefined,
    addresses: Buffer[] = undefined,
    locktime: BN = undefined,
    threshold: number = undefined,
    stakeableLocktime: BN = undefined,
    output: ParseableOutput = undefined
  ) {
    super(
      output
        ? output.getOutput()
        : new SECPTransferOutput(amount, addresses, locktime, threshold)
    )
    if (typeof stakeableLocktime !== "undefined") {
      this.stakeableLocktime = bintools.fromBNToBuffer(stakeableLocktime, 8)
    }
  }
}

/**
 * An [[Output]] class which only specifies an Output ownership and uses secp256k1 signature scheme.
 */
export class SECPOwnerOutput extends Output {
  protected _typeName = "SECPOwnerOutput"
  protected _typeID = PlatformVMConstants.SECPOWNEROUTPUTID

  //serialize and deserialize both are inherited

  /**
   * Returns the outputID for this output
   */
  getOutputID(): number {
    return this._typeID
  }

  /**
   *
   * @param assetID An assetID which is wrapped around the Buffer of the Output
   */
  makeTransferable(assetID: Buffer): TransferableOutput {
    return new TransferableOutput(assetID, this)
  }

  create(...args: any[]): this {
    return new SECPOwnerOutput(...args) as this
  }

  clone(): this {
    const newout: SECPOwnerOutput = this.create()
    newout.fromBuffer(this.toBuffer())
    return newout as this
  }
}

/**
 * An [[Output]] class which specifies an output that is controlled by deposit and bond tx.
 */
export class LockedOut extends ParseableOutput {
  protected _typeName = "LockedOut"
  protected _typeID = PlatformVMConstants.LOCKEDOUTID

  //serialize and deserialize both are inherited
  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    let outobj: object = {
      ...fields,
      ids: this.ids.serialize()
    }
    return outobj
  }

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.ids.deserialize(fields["ids"], encoding)
  }

  protected ids: LockedIDs = new LockedIDs()

  getLockedIDs(): LockedIDs {
    return this.ids
  }

  /**
   * @param assetID An assetID which is wrapped around the Buffer of the Output
   */
  makeTransferable(assetID: Buffer): TransferableOutput {
    return new TransferableOutput(assetID, this)
  }

  create(...args: any[]): this {
    return new LockedOut(...args) as this
  }

  clone(): this {
    const newout: LockedOut = this.create()
    newout.fromBuffer(this.toBuffer())
    return newout as this
  }

  /**
   * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[LockedOut]] and returns the size of the output.
   */
  fromBuffer(outbuff: Buffer, offset: number = 0): number {
    offset = this.ids.fromBuffer(outbuff, offset)
    offset = super.fromBuffer(outbuff, offset)
    return offset
  }

  /**
   * Returns the buffer representing the [[LockedOut]] instance.
   */
  toBuffer(): Buffer {
    const idsBuf: Buffer = this.ids.toBuffer()
    const superBuff: Buffer = super.toBuffer()
    return Buffer.concat([idsBuf, superBuff], superBuff.length + 64)
  }

  /**
   * Returns the outputID for this output
   */
  getOutputID(): number {
    return this._typeID
  }

  /**
   * Returns the amount from the underlying output
   */
  getAmount(): BN {
    return (this.getOutput() as StandardAmountOutput).getAmount()
  }

  /**
   * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the output
   * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
   * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
   * @param threshold A number representing the the threshold number of signers required to sign the transaction
   * @param ids LockIDs set of deposit and bond txIDs
   */
  constructor(
    amount: BN = undefined,
    addresses: Buffer[] = undefined,
    locktime: BN = undefined,
    threshold: number = undefined,
    ids: LockedIDs = undefined
  ) {
    super(new SECPTransferOutput(amount, addresses, locktime, threshold))
    if (typeof ids !== "undefined") this.ids = ids
  }
}
