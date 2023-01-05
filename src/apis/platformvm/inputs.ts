/**
 * @packageDocumentation
 * @module API-PlatformVM-Inputs
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import {
  BaseInput,
  StandardTransferableInput,
  StandardAmountInput,
  StandardParseableInput
} from "../../common/input"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import BN from "bn.js"
import { InputIdError } from "../../utils/errors"
import { LockedIDs } from "./locked"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Takes a buffer representing the output and returns the proper [[Input]] instance.
 *
 * @param inputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Input]]-extended class.
 */
export const SelectInputClass = (
  inputid: number,
  ...args: any[]
): BaseInput => {
  if (inputid === PlatformVMConstants.SECPINPUTID) {
    return new SECPTransferInput(...args)
  } else if (inputid === PlatformVMConstants.STAKEABLELOCKINID) {
    return new StakeableLockIn(...args)
  } else if (inputid === PlatformVMConstants.LOCKEDINID) {
    return new LockedIn(...args)
  }
  /* istanbul ignore next */
  throw new InputIdError("Error - SelectInputClass: unknown inputid")
}

export class ParseableInput extends StandardParseableInput {
  protected _typeName = "ParseableInput"
  protected _typeID = undefined

  //serialize is inherited
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.input = SelectInputClass(fields["input"]["_typeID"])
    this.input.deserialize(fields["input"], encoding)
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    const inputid: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.input = SelectInputClass(inputid)
    return this.input.fromBuffer(bytes, offset)
  }
}

export class TransferableInput extends StandardTransferableInput {
  protected _typeName = "TransferableInput"
  protected _typeID = undefined

  //serialize is inherited

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.input = SelectInputClass(fields["input"]["_typeID"])
    this.input.deserialize(fields["input"], encoding)
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing a [[TransferableInput]], parses it, populates the class, and returns the length of the [[TransferableInput]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[TransferableInput]]
   *
   * @returns The length of the raw [[TransferableInput]]
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.txid = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    this.outputidx = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    this.assetID = bintools.copyFrom(
      bytes,
      offset,
      offset + PlatformVMConstants.ASSETIDLEN
    )
    offset += 32
    const inputid: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.input = SelectInputClass(inputid)
    return this.input.fromBuffer(bytes, offset)
  }

  static fromArray(b: Buffer): TransferableInput[] {
    var offset = 6 //version + counter
    var num = b.readUInt32BE(2)
    const result: TransferableInput[] = []
    while (offset < b.length && num-- > 0) {
      const t = new TransferableInput()
      offset = t.fromBuffer(b, offset)
      result.push(t)
    }
    return result
  }
}

export abstract class AmountInput extends StandardAmountInput {
  protected _typeName = "AmountInput"
  protected _typeID = undefined

  //serialize and deserialize both are inherited

  select(id: number, ...args: any[]): BaseInput {
    return SelectInputClass(id, ...args)
  }
}

export class SECPTransferInput extends AmountInput {
  protected _typeName = "SECPTransferInput"
  protected _typeID = PlatformVMConstants.SECPINPUTID

  //serialize and deserialize both are inherited

  /**
   * Returns the inputID for this input
   */
  getInputID(): number {
    return this._typeID
  }

  getCredentialID = (): number => PlatformVMConstants.SECPCREDENTIAL

  create(...args: any[]): this {
    return new SECPTransferInput(...args) as this
  }

  clone(): this {
    const newout: SECPTransferInput = this.create()
    newout.fromBuffer(this.toBuffer())
    return newout as this
  }
}

/**
 * An [[Input]] class which specifies an input that has a locktime which can also
 * enable staking of the value held, preventing transfers but not validation.
 */
export class StakeableLockIn extends ParseableInput {
  protected _typeName = "StakeableLockIn"
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
   * Returns the inputID for this input
   */
  getInputID(): number {
    return this._typeID
  }

  getCredentialID = (): number => PlatformVMConstants.SECPCREDENTIAL

  create(...args: any[]): this {
    return new StakeableLockIn(...args) as this
  }

  clone(): this {
    const newout: StakeableLockIn = this.create()
    newout.fromBuffer(this.toBuffer())
    return newout as this
  }

  /**
   * Returns the amount from the underlying input
   */
  getAmount(): BN {
    return (this.getInput() as StandardAmountInput).getAmount()
  }

  /**
   * Backwards compatibility
   */
  getTransferableInput(): ParseableInput {
    return this
  }

  /**
   * A [[Input]] class which specifies an [[Input]] that has a locktime which can also
   * enable staking of the value held, preventing transfers but not validation.
   *
   * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the input
   * @param stakeableLocktime A {@link https://github.com/indutny/bn.js/|BN} representing the stakeable locktime
   * @param transferableInput A [[ParseableInput]] which is embedded into this input.
   */
  constructor(
    amount: BN = undefined,
    stakeableLocktime: BN = undefined,
    transferableInput: ParseableInput = undefined
  ) {
    super(
      typeof transferableInput !== "undefined"
        ? transferableInput.getInput()
        : new SECPTransferInput(amount)
    )
    if (typeof stakeableLocktime !== "undefined") {
      this.stakeableLocktime = bintools.fromBNToBuffer(stakeableLocktime, 8)
    }
  }
}

/**
 * An [[Input]] class which specifies an input that is controlled by deposit and bond tx.
 */
export class LockedIn extends ParseableInput {
  protected _typeName = "LockedIn"
  protected _typeID = PlatformVMConstants.LOCKEDINID

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

  create(...args: any[]): this {
    return new LockedIn(...args) as this
  }

  clone(): this {
    const newout: LockedIn = this.create()
    newout.fromBuffer(this.toBuffer())
    return newout as this
  }

  /**
   * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer}
   * representing the [[LockedIn]] and returns the size of the input.
   */
  fromBuffer(outbuff: Buffer, offset: number = 0): number {
    offset = this.ids.fromBuffer(outbuff, offset)
    offset = super.fromBuffer(outbuff, offset)
    return offset
  }

  /**
   * Returns the buffer representing the [[LockedIn]] instance.
   */
  toBuffer(): Buffer {
    const idsBuf: Buffer = this.ids.toBuffer()
    const superBuff: Buffer = super.toBuffer()
    return Buffer.concat([idsBuf, superBuff], superBuff.length + 64)
  }

  /**
   * Returns the inputID for this input
   */
  getInputID(): number {
    return this._typeID
  }

  /**
   * Returns the credentialID for this input
   */
  getCredentialID = (): number => PlatformVMConstants.SECPCREDENTIAL

  /**
   * Returns the amount from the underlying input
   */
  getAmount(): BN {
    return (this.getInput() as StandardAmountInput).getAmount()
  }

  /**
   * An [[Input]] class which specifies an input that is controlled by deposit and bond tx.
   *
   * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the input
   */
  constructor(amount: BN = undefined) {
    super(new SECPTransferInput(amount))
  }
}
