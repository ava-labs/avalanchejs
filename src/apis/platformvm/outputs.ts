/**
 * @packageDocumentation
 * @module API-PlatformVM-Outputs
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import {
  Output,
  StandardAmountOutput,
  StandardTransferableOutput,
  StandardParseableOutput,
  Address
} from "../../common/output"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import BN from "bn.js"
import { OutputIdError } from "../../utils/errors"

const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Takes a buffer representing the output and returns the proper Output instance.
 *
 * @param outputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Output]]-extended class.
 */
export const SelectOutputClass = (outputid: number, ...args: any[]): Output => {
  if (outputid == PlatformVMConstants.SECPXFEROUTPUTID) {
    return new SECPTransferOutput(...args)
  } else if (outputid == PlatformVMConstants.SECPOWNEROUTPUTID) {
    return new SECPOwnerOutput(...args)
  } else if (outputid == PlatformVMConstants.STAKEABLELOCKOUTID) {
    return new StakeableLockOut(...args)
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

  select(id: number, ...args: any[]): Output {
    return SelectOutputClass(id, ...args)
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
 * An [[Output]] class which specifies an input that has a locktime which can also enable staking of the value held, preventing transfers but not validation.
 */
export class StakeableLockOut extends AmountOutput {
  protected _typeName = "StakeableLockOut"
  protected _typeID = PlatformVMConstants.STAKEABLELOCKOUTID

  //serialize and deserialize both are inherited

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    let outobj: object = {
      ...fields, //included anywayyyy... not ideal
      stakeableLocktime: serialization.encoder(
        this.stakeableLocktime,
        encoding,
        "Buffer",
        "decimalString",
        8
      ),
      transferableOutput: this.transferableOutput.serialize(encoding)
    }
    delete outobj["addresses"]
    delete outobj["locktime"]
    delete outobj["threshold"]
    delete outobj["amount"]
    return outobj
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    fields["addresses"] = []
    fields["locktime"] = "0"
    fields["threshold"] = "1"
    fields["amount"] = "99"
    super.deserialize(fields, encoding)
    this.stakeableLocktime = serialization.decoder(
      fields["stakeableLocktime"],
      encoding,
      "decimalString",
      "Buffer",
      8
    )
    this.transferableOutput = new ParseableOutput()
    this.transferableOutput.deserialize(fields["transferableOutput"], encoding)
    this.synchronize()
  }

  protected stakeableLocktime: Buffer
  protected transferableOutput: ParseableOutput

  //call this every time you load in data
  private synchronize() {
    let output: AmountOutput =
      this.transferableOutput.getOutput() as AmountOutput
    this.addresses = output.getAddresses().map((a) => {
      let addr: Address = new Address()
      addr.fromBuffer(a)
      return addr
    })
    this.numaddrs = Buffer.alloc(4)
    this.numaddrs.writeUInt32BE(this.addresses.length, 0)
    this.locktime = bintools.fromBNToBuffer(output.getLocktime(), 8)
    this.threshold = Buffer.alloc(4)
    this.threshold.writeUInt32BE(output.getThreshold(), 0)
    this.amount = bintools.fromBNToBuffer(output.getAmount(), 8)
    this.amountValue = output.getAmount()
  }

  getStakeableLocktime(): BN {
    return bintools.fromBufferToBN(this.stakeableLocktime)
  }

  getTransferableOutput(): ParseableOutput {
    return this.transferableOutput
  }

  /**
   * @param assetID An assetID which is wrapped around the Buffer of the Output
   */
  makeTransferable(assetID: Buffer): TransferableOutput {
    return new TransferableOutput(assetID, this)
  }

  select(id: number, ...args: any[]): Output {
    return SelectOutputClass(id, ...args)
  }

  /**
   * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[StakeableLockOut]] and returns the size of the output.
   */
  fromBuffer(outbuff: Buffer, offset: number = 0): number {
    this.stakeableLocktime = bintools.copyFrom(outbuff, offset, offset + 8)
    offset += 8
    this.transferableOutput = new ParseableOutput()
    offset = this.transferableOutput.fromBuffer(outbuff, offset)
    this.synchronize()
    return offset
  }

  /**
   * Returns the buffer representing the [[StakeableLockOut]] instance.
   */
  toBuffer(): Buffer {
    let xferoutBuff: Buffer = this.transferableOutput.toBuffer()
    const bsize: number = this.stakeableLocktime.length + xferoutBuff.length
    const barr: Buffer[] = [this.stakeableLocktime, xferoutBuff]
    return Buffer.concat(barr, bsize)
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
   * A [[Output]] class which specifies a [[ParseableOutput]] that has a locktime which can also enable staking of the value held, preventing transfers but not validation.
   *
   * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the output
   * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
   * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
   * @param threshold A number representing the the threshold number of signers required to sign the transaction
   * @param stakeableLocktime A {@link https://github.com/indutny/bn.js/|BN} representing the stakeable locktime
   * @param transferableOutput A [[ParseableOutput]] which is embedded into this output.
   */
  constructor(
    amount: BN = undefined,
    addresses: Buffer[] = undefined,
    locktime: BN = undefined,
    threshold: number = undefined,
    stakeableLocktime: BN = undefined,
    transferableOutput: ParseableOutput = undefined
  ) {
    super(amount, addresses, locktime, threshold)
    if (typeof stakeableLocktime !== "undefined") {
      this.stakeableLocktime = bintools.fromBNToBuffer(stakeableLocktime, 8)
    }
    if (typeof transferableOutput !== "undefined") {
      this.transferableOutput = transferableOutput
      this.synchronize()
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

  select(id: number, ...args: any[]): Output {
    return SelectOutputClass(id, ...args)
  }
}
