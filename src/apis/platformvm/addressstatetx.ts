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
import {
  DefaultNetworkID,
  DefaultTransactionVersionNumber
} from "../../utils/constants"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import { UpgradeVersionID } from "../../common"
import { SubnetAuth } from "../../apis/platformvm/subnetauth"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

export enum AddressState {
  ROLE_ADMIN = 0,
  ROLE_KYC = 1,
  ROLE_OFFERS_ADMIN = 2,
  KYC_VERIFIED = 32,
  KYC_EXPIRED = 33,
  CONSORTIUM = 38,
  NODE_DEFERRED = 39,
  OFFERS_CREATOR = 50
}

/**
 * Class representing an unsigned AdressStateTx transaction.
 */
export class AddressStateTx extends BaseTx {
  protected _typeName = "AddressStateTx"
  protected _typeID = PlatformVMConstants.ADDRESSSTATETX

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    let fieldsV1: object = {}
    if (this.upgradeVersionID.version() > 0) {
      fieldsV1 = {
        executor: serialization.encoder(
          this.executor,
          encoding,
          "Buffer",
          "cb58"
        ),
        executorAuth: this.executorAuth.serialize(encoding)
      }
    }
    return {
      ...fields,
      address: serialization.encoder(this.address, encoding, "Buffer", "cb58"),
      state: this.state,
      remove: this.remove,
      ...fieldsV1
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

    if (this.upgradeVersionID.version() > 0) {
      this.executor = serialization.decoder(
        fields["executor"],
        encoding,
        "cb58",
        "Buffer"
      )
      this.executorAuth.deserialize(fields["executorAuth"], encoding)
    }
  }

  // UpgradeVersionID (since SP1)
  protected upgradeVersionID = new UpgradeVersionID()
  // The address to add / remove state
  protected address = Buffer.alloc(20)
  // The state to set / unset
  protected state = 0
  // Remove or add the flag ?
  protected remove: boolean
  protected executor = Buffer.alloc(20)
  protected executorAuth: SubnetAuth

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
  getState(): number {
    return this.state
  }

  /**
   * Returns the remove flag
   */
  getRemove(): boolean {
    return this.remove
  }

  getExecutor(): Buffer {
    return this.executor
  }
  getExecutorAuth(): SubnetAuth {
    return this.executorAuth
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
    this.upgradeVersionID = new UpgradeVersionID()
    offset = this.upgradeVersionID.fromBuffer(bytes, offset)
    offset = super.fromBuffer(bytes, offset)
    this.address = bintools.copyFrom(bytes, offset, offset + 20)
    offset += 20
    this.state = bintools.copyFrom(bytes, offset, offset + 1)[0]
    offset += 1
    this.remove = bintools.copyFrom(bytes, offset, offset + 1)[0] != 0
    offset += 1
    if (this.upgradeVersionID.version() > 0) {
      this.executor = bintools.copyFrom(bytes, offset, offset + 20)
      offset += 20
      let sa: SubnetAuth = new SubnetAuth()
      offset += sa.fromBuffer(bintools.copyFrom(bytes, offset))
      this.executorAuth = sa
    }
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[AddressStateTx]].
   */
  toBuffer(): Buffer {
    const upgradeBuf = this.upgradeVersionID.toBuffer()
    const superbuff: Buffer = super.toBuffer()

    let bsize: number =
      upgradeBuf.length + superbuff.length + this.address.length + 2
    const barr: Buffer[] = [
      upgradeBuf,
      superbuff,
      this.address,
      Buffer.from([this.state]),
      Buffer.from([this.remove ? 1 : 0])
    ]
    if (this.upgradeVersionID.version() > 0) {
      const authBuffer = this.executorAuth.toBuffer()
      bsize += this.executor.length + authBuffer.length
      barr.push(this.executor, authBuffer)
    }
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
   * @param version Optional. Transaction version number
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
    version: number = DefaultTransactionVersionNumber,
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    address: string | Buffer = undefined,
    state: number = undefined,
    remove: boolean = undefined,
    executor: string | Buffer = undefined,
    executorAuth: SubnetAuth = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    this.upgradeVersionID = new UpgradeVersionID(version)
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
    if (typeof executor != "undefined") {
      if (typeof executor === "string") {
        this.executor = bintools.stringToAddress(executor)
      } else {
        this.executor = executor
      }
    }
    if (typeof executorAuth !== "undefined") {
      this.executorAuth = executorAuth
    } else {
      this.executorAuth = new SubnetAuth()
    }
  }
}
