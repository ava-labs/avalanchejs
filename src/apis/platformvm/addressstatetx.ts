/**
 * @packageDocumentation
 * @module API-PlatformVM-AddressStateTx
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { PlatformVMConstants } from "./constants"
import { TransferableOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { BaseTx } from "./basetx"
import { DefaultNetworkID } from "../../utils/constants"
import { Serialization, SerializedEncoding } from "../../utils/serialization"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Class representing an unsigned AdressStateTx transaction.
 */
export class AddressStateTx extends BaseTx {
  protected _typeName = "AddressStateTx"
  protected _typeID = PlatformVMConstants.ADDRESSSTATETX

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      address: serialization.encoder(this.address, encoding, "Buffer", "cb58"),
      state: this.state,
      remove: this.remove
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.address = serialization.decoder(
      fields["address"],
      encoding,
      "cb58",
      "Buffer",
      20
    )
    this.state = fields["state"]
    this.remove = fields["remove"]
  }

  // The address to add / remove state
  protected address = Buffer.alloc(20)
  // The state to set / unset
  protected state = 0
  // Remove or add the flag ?
  protected remove: boolean

  /**
   * Returns the id of the [[AddressStateTx]]
   */
  getTxType(): number {
    return this._typeID
  }

  /**
   * Returns the address
   */
  getAddress(): Buffer {
    return this.address
  }

  /**
   * Returns the state
   */
  getState(): Number {
    return this.state
  }

  /**
   * Returns the remove flag
   */
  getRemove(): boolean {
    return this.remove
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[AddressStateTx]], parses it, populates the class, and returns the length of the [[AddressStateTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[AddressStateTx]]
   *
   * @returns The length of the raw [[AddressStateTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    this.address = bintools.copyFrom(bytes, offset, offset + 20)
    offset += 20
    this.state = bintools.copyFrom(bytes, offset, offset + 1)[0]
    offset += 1
    this.remove = bintools.copyFrom(bytes, offset, offset + 1)[0] != 0
    offset += 1
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[AddressStateTx]].
   */
  toBuffer(): Buffer {
    const superbuff: Buffer = super.toBuffer()

    let bsize: number = superbuff.length + this.address.length + 2
    const barr: Buffer[] = [
      superbuff,
      this.address,
      Buffer.from([this.state]),
      Buffer.from([this.remove ? 1 : 0])
    ]
    return Buffer.concat(barr, bsize)
  }

  clone(): this {
    const newAddressStateTx: AddressStateTx = new AddressStateTx()
    newAddressStateTx.fromBuffer(this.toBuffer())
    return newAddressStateTx as this
  }

  create(...args: any[]): this {
    return new AddressStateTx(...args) as this
  }

  /**
   * Class representing an unsigned RegisterNode transaction.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param address Optional address to alter state.
   * @param state Optional state to alter.
   * @param remove Optional if true remove the flag, otherwise set
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    address: string | Buffer = undefined,
    state: number = undefined,
    remove: boolean = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    if (typeof address != "undefined") {
      if (typeof address === "string") {
        this.address = bintools.stringToAddress(address)
      } else {
        this.address = address
      }
    }
    if (typeof state != "undefined") {
      this.state = state
    }
    if (typeof remove != "undefined") {
      this.remove = remove
    }
  }
}
