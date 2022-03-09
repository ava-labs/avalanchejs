/**
 * @packageDocumentation
 * @module Common-Output
 */

import { Buffer } from "buffer/"
import BN from "bn.js"
import BinTools from "../utils/bintools"
import { NBytes } from "./nbytes"
import { UnixNow } from "../utils/helperfunctions"
import {
  Serializable,
  Serialization,
  SerializedEncoding
} from "../utils/serialization"
import { ChecksumError, AddressError, AddressIndexError } from "../utils/errors"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Class for representing an address used in [[Output]] types
 */
export class Address extends NBytes {
  protected _typeName = "Address"
  protected _typeID = undefined

  //serialize and deserialize both are inherited

  protected bytes = Buffer.alloc(20)
  protected bsize = 20

  /**
   * Returns a function used to sort an array of [[Address]]es
   */
  static comparator =
    (): ((a: Address, b: Address) => 1 | -1 | 0) =>
    (a: Address, b: Address): 1 | -1 | 0 =>
      Buffer.compare(a.toBuffer(), b.toBuffer()) as 1 | -1 | 0

  /**
   * Returns a base-58 representation of the [[Address]].
   */
  toString(): string {
    return bintools.cb58Encode(this.toBuffer())
  }

  /**
   * Takes a base-58 string containing an [[Address]], parses it, populates the class, and returns the length of the Address in bytes.
   *
   * @param bytes A base-58 string containing a raw [[Address]]
   *
   * @returns The length of the raw [[Address]]
   */
  fromString(addr: string): number {
    const addrbuff: Buffer = bintools.b58ToBuffer(addr)
    if (addrbuff.length === 24 && bintools.validateChecksum(addrbuff)) {
      const newbuff: Buffer = bintools.copyFrom(
        addrbuff,
        0,
        addrbuff.length - 4
      )
      if (newbuff.length === 20) {
        this.bytes = newbuff
      }
    } else if (addrbuff.length === 24) {
      throw new ChecksumError(
        "Error - Address.fromString: invalid checksum on address"
      )
    } else if (addrbuff.length === 20) {
      this.bytes = addrbuff
    } else {
      /* istanbul ignore next */
      throw new AddressError("Error - Address.fromString: invalid address")
    }
    return this.getSize()
  }

  clone(): this {
    let newbase: Address = new Address()
    newbase.fromBuffer(this.toBuffer())
    return newbase as this
  }

  create(...args: any[]): this {
    return new Address() as this
  }

  /**
   * Class for representing an address used in [[Output]] types
   */
  constructor() {
    super()
  }
}

/**
 * Defines the most basic values for output ownership. Mostly inherited from, but can be used in population of NFT Owner data.
 */
export class OutputOwners extends Serializable {
  protected _typeName = "OutputOwners"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      locktime: serialization.encoder(
        this.locktime,
        encoding,
        "Buffer",
        "decimalString",
        8
      ),
      threshold: serialization.encoder(
        this.threshold,
        encoding,
        "Buffer",
        "decimalString",
        4
      ),
      addresses: this.addresses.map((a: Address): object =>
        a.serialize(encoding)
      )
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.locktime = serialization.decoder(
      fields["locktime"],
      encoding,
      "decimalString",
      "Buffer",
      8
    )
    this.threshold = serialization.decoder(
      fields["threshold"],
      encoding,
      "decimalString",
      "Buffer",
      4
    )
    this.addresses = fields["addresses"].map((a: object) => {
      let addr: Address = new Address()
      addr.deserialize(a, encoding)
      return addr
    })
    this.numaddrs = Buffer.alloc(4)
    this.numaddrs.writeUInt32BE(this.addresses.length, 0)
  }

  protected locktime: Buffer = Buffer.alloc(8)
  protected threshold: Buffer = Buffer.alloc(4)
  protected numaddrs: Buffer = Buffer.alloc(4)
  protected addresses: Address[] = []

  /**
   * Returns the threshold of signers required to spend this output.
   */
  getThreshold = (): number => this.threshold.readUInt32BE(0)

  /**
   * Returns the a {@link https://github.com/indutny/bn.js/|BN} repersenting the UNIX Timestamp when the lock is made available.
   */
  getLocktime = (): BN => bintools.fromBufferToBN(this.locktime)

  /**
   * Returns an array of {@link https://github.com/feross/buffer|Buffer}s for the addresses.
   */
  getAddresses = (): Buffer[] => {
    const result: Buffer[] = []
    for (let i: number = 0; i < this.addresses.length; i++) {
      result.push(this.addresses[`${i}`].toBuffer())
    }
    return result
  }

  /**
   * Returns the index of the address.
   *
   * @param address A {@link https://github.com/feross/buffer|Buffer} of the address to look up to return its index.
   *
   * @returns The index of the address.
   */
  getAddressIdx = (address: Buffer): number => {
    for (let i: number = 0; i < this.addresses.length; i++) {
      if (
        this.addresses[`${i}`].toBuffer().toString("hex") ===
        address.toString("hex")
      ) {
        return i
      }
    }
    /* istanbul ignore next */
    return -1
  }

  /**
   * Returns the address from the index provided.
   *
   * @param idx The index of the address.
   *
   * @returns Returns the string representing the address.
   */
  getAddress = (idx: number): Buffer => {
    if (idx < this.addresses.length) {
      return this.addresses[`${idx}`].toBuffer()
    }
    throw new AddressIndexError("Error - Output.getAddress: idx out of range")
  }

  /**
   * Given an array of address {@link https://github.com/feross/buffer|Buffer}s and an optional timestamp, returns true if the addresses meet the threshold required to spend the output.
   */
  meetsThreshold = (addresses: Buffer[], asOf: BN = undefined): boolean => {
    let now: BN
    if (typeof asOf === "undefined") {
      now = UnixNow()
    } else {
      now = asOf
    }
    const qualified: Buffer[] = this.getSpenders(addresses, now)
    const threshold: number = this.threshold.readUInt32BE(0)
    if (qualified.length >= threshold) {
      return true
    }

    return false
  }

  /**
   * Given an array of addresses and an optional timestamp, select an array of address {@link https://github.com/feross/buffer|Buffer}s of qualified spenders for the output.
   */
  getSpenders = (addresses: Buffer[], asOf: BN = undefined): Buffer[] => {
    const qualified: Buffer[] = []
    let now: BN
    if (typeof asOf === "undefined") {
      now = UnixNow()
    } else {
      now = asOf
    }
    const locktime: BN = bintools.fromBufferToBN(this.locktime)
    if (now.lte(locktime)) {
      // not unlocked, not spendable
      return qualified
    }

    const threshold: number = this.threshold.readUInt32BE(0)
    for (
      let i: number = 0;
      i < this.addresses.length && qualified.length < threshold;
      i++
    ) {
      for (
        let j: number = 0;
        j < addresses.length && qualified.length < threshold;
        j++
      ) {
        if (
          addresses[`${j}`].toString("hex") ===
          this.addresses[`${i}`].toBuffer().toString("hex")
        ) {
          qualified.push(addresses[`${j}`])
        }
      }
    }

    return qualified
  }

  /**
   * Returns a base-58 string representing the [[Output]].
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.locktime = bintools.copyFrom(bytes, offset, offset + 8)
    offset += 8
    this.threshold = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    this.numaddrs = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    const numaddrs: number = this.numaddrs.readUInt32BE(0)
    this.addresses = []
    for (let i: number = 0; i < numaddrs; i++) {
      const addr: Address = new Address()
      offset = addr.fromBuffer(bytes, offset)
      this.addresses.push(addr)
    }
    this.addresses.sort(Address.comparator())
    return offset
  }

  /**
   * Returns the buffer representing the [[Output]] instance.
   */
  toBuffer(): Buffer {
    this.addresses.sort(Address.comparator())
    this.numaddrs.writeUInt32BE(this.addresses.length, 0)
    let bsize: number =
      this.locktime.length + this.threshold.length + this.numaddrs.length
    const barr: Buffer[] = [this.locktime, this.threshold, this.numaddrs]
    for (let i: number = 0; i < this.addresses.length; i++) {
      const b: Buffer = this.addresses[`${i}`].toBuffer()
      barr.push(b)
      bsize += b.length
    }
    return Buffer.concat(barr, bsize)
  }

  /**
   * Returns a base-58 string representing the [[Output]].
   */
  toString(): string {
    return bintools.bufferToB58(this.toBuffer())
  }

  static comparator =
    (): ((a: Output, b: Output) => 1 | -1 | 0) =>
    (a: Output, b: Output): 1 | -1 | 0 => {
      const aoutid: Buffer = Buffer.alloc(4)
      aoutid.writeUInt32BE(a.getOutputID(), 0)
      const abuff: Buffer = a.toBuffer()

      const boutid: Buffer = Buffer.alloc(4)
      boutid.writeUInt32BE(b.getOutputID(), 0)
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

  /**
   * An [[Output]] class which contains addresses, locktimes, and thresholds.
   *
   * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing output owner's addresses
   * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
   * @param threshold A number representing the the threshold number of signers required to sign the transaction
   */
  constructor(
    addresses: Buffer[] = undefined,
    locktime: BN = undefined,
    threshold: number = undefined
  ) {
    super()
    if (typeof addresses !== "undefined" && addresses.length) {
      const addrs: Address[] = []
      for (let i: number = 0; i < addresses.length; i++) {
        addrs[`${i}`] = new Address()
        addrs[`${i}`].fromBuffer(addresses[`${i}`])
      }
      this.addresses = addrs
      this.addresses.sort(Address.comparator())
      this.numaddrs.writeUInt32BE(this.addresses.length, 0)
    }
    if (typeof threshold !== undefined) {
      this.threshold.writeUInt32BE(threshold || 1, 0)
    }
    if (typeof locktime !== "undefined") {
      this.locktime = bintools.fromBNToBuffer(locktime, 8)
    }
  }
}

export abstract class Output extends OutputOwners {
  protected _typeName = "Output"
  protected _typeID = undefined

  //serialize and deserialize both are inherited

  /**
   * Returns the outputID for the output which tells parsers what type it is
   */
  abstract getOutputID(): number

  abstract clone(): this

  abstract create(...args: any[]): this

  abstract select(id: number, ...args: any[]): Output

  /**
   *
   * @param assetID An assetID which is wrapped around the Buffer of the Output
   *
   * Must be implemented to use the appropriate TransferableOutput for the VM.
   */
  abstract makeTransferable(assetID: Buffer): StandardTransferableOutput
}

export abstract class StandardParseableOutput extends Serializable {
  protected _typeName = "StandardParseableOutput"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      output: this.output.serialize(encoding)
    }
  }

  protected output: Output

  /**
   * Returns a function used to sort an array of [[ParseableOutput]]s
   */
  static comparator =
    (): ((
      a: StandardParseableOutput,
      b: StandardParseableOutput
    ) => 1 | -1 | 0) =>
    (a: StandardParseableOutput, b: StandardParseableOutput): 1 | -1 | 0 => {
      const sorta = a.toBuffer()
      const sortb = b.toBuffer()
      return Buffer.compare(sorta, sortb) as 1 | -1 | 0
    }

  getOutput = (): Output => this.output

  // must be implemented to select output types for the VM in question
  abstract fromBuffer(bytes: Buffer, offset?: number): number

  toBuffer(): Buffer {
    const outbuff: Buffer = this.output.toBuffer()
    const outid: Buffer = Buffer.alloc(4)
    outid.writeUInt32BE(this.output.getOutputID(), 0)
    const barr: Buffer[] = [outid, outbuff]
    return Buffer.concat(barr, outid.length + outbuff.length)
  }

  /**
   * Class representing an [[ParseableOutput]] for a transaction.
   *
   * @param output A number representing the InputID of the [[ParseableOutput]]
   */
  constructor(output: Output = undefined) {
    super()
    if (output instanceof Output) {
      this.output = output
    }
  }
}

export abstract class StandardTransferableOutput extends StandardParseableOutput {
  protected _typeName = "StandardTransferableOutput"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      assetID: serialization.encoder(this.assetID, encoding, "Buffer", "cb58")
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.assetID = serialization.decoder(
      fields["assetID"],
      encoding,
      "cb58",
      "Buffer",
      32
    )
  }

  protected assetID: Buffer = undefined

  getAssetID = (): Buffer => this.assetID

  // must be implemented to select output types for the VM in question
  abstract fromBuffer(bytes: Buffer, offset?: number): number

  toBuffer(): Buffer {
    const parseableBuff: Buffer = super.toBuffer()
    const barr: Buffer[] = [this.assetID, parseableBuff]
    return Buffer.concat(barr, this.assetID.length + parseableBuff.length)
  }

  /**
   * Class representing an [[StandardTransferableOutput]] for a transaction.
   *
   * @param assetID A {@link https://github.com/feross/buffer|Buffer} representing the assetID of the [[Output]]
   * @param output A number representing the InputID of the [[StandardTransferableOutput]]
   */
  constructor(assetID: Buffer = undefined, output: Output = undefined) {
    super(output)
    if (typeof assetID !== "undefined") {
      this.assetID = assetID
    }
  }
}

/**
 * An [[Output]] class which specifies a token amount .
 */
export abstract class StandardAmountOutput extends Output {
  protected _typeName = "StandardAmountOutput"
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
  getAmount(): BN {
    return this.amountValue.clone()
  }

  /**
   * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[StandardAmountOutput]] and returns the size of the output.
   */
  fromBuffer(outbuff: Buffer, offset: number = 0): number {
    this.amount = bintools.copyFrom(outbuff, offset, offset + 8)
    this.amountValue = bintools.fromBufferToBN(this.amount)
    offset += 8
    return super.fromBuffer(outbuff, offset)
  }

  /**
   * Returns the buffer representing the [[StandardAmountOutput]] instance.
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()
    const bsize: number = this.amount.length + superbuff.length
    this.numaddrs.writeUInt32BE(this.addresses.length, 0)
    const barr: Buffer[] = [this.amount, superbuff]
    return Buffer.concat(barr, bsize)
  }

  /**
   * A [[StandardAmountOutput]] class which issues a payment on an assetID.
   *
   * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the output
   * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
   * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
   * @param threshold A number representing the the threshold number of signers required to sign the transaction
   */
  constructor(
    amount: BN = undefined,
    addresses: Buffer[] = undefined,
    locktime: BN = undefined,
    threshold: number = undefined
  ) {
    super(addresses, locktime, threshold)
    if (typeof amount !== "undefined") {
      this.amountValue = amount.clone()
      this.amount = bintools.fromBNToBuffer(amount, 8)
    }
  }
}

/**
 * An [[Output]] class which specifies an NFT.
 */
export abstract class BaseNFTOutput extends Output {
  protected _typeName = "BaseNFTOutput"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      groupID: serialization.encoder(
        this.groupID,
        encoding,
        "Buffer",
        "decimalString",
        4
      )
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.groupID = serialization.decoder(
      fields["groupID"],
      encoding,
      "decimalString",
      "Buffer",
      4
    )
  }

  protected groupID: Buffer = Buffer.alloc(4)

  /**
   * Returns the groupID as a number.
   */
  getGroupID = (): number => {
    return this.groupID.readUInt32BE(0)
  }
}
