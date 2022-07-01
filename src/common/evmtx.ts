/**
 * @packageDocumentation
 * @module Common-Transactions
 */

import { Buffer } from "buffer/"
import BinTools from "../utils/bintools"
import { Credential } from "./credentials"
import BN from "bn.js"
import { StandardKeyChain, StandardKeyPair } from "./keychain"
import { StandardAmountInput, StandardTransferableInput } from "./input"
import { StandardAmountOutput, StandardTransferableOutput } from "./output"
import { DefaultNetworkID } from "../utils/constants"
import {
  Serializable,
  Serialization,
  SerializedEncoding
} from "../utils/serialization"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serializer: Serialization = Serialization.getInstance()

/**
 * Class representing a base for all transactions.
 */
export abstract class EVMStandardBaseTx<
  KPClass extends StandardKeyPair,
  KCClass extends StandardKeyChain<KPClass>
> extends Serializable {
  protected _typeName = "EVMStandardBaseTx"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      networkID: serializer.encoder(
        this.networkID,
        encoding,
        "Buffer",
        "decimalString"
      ),
      blockchainID: serializer.encoder(
        this.blockchainID,
        encoding,
        "Buffer",
        "cb58"
      )
    }
  }

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.networkID = serializer.decoder(
      fields["networkID"],
      encoding,
      "decimalString",
      "Buffer",
      4
    )
    this.blockchainID = serializer.decoder(
      fields["blockchainID"],
      encoding,
      "cb58",
      "Buffer",
      32
    )
  }

  protected networkID: Buffer = Buffer.alloc(4)
  protected blockchainID: Buffer = Buffer.alloc(32)

  /**
   * Returns the id of the [[StandardBaseTx]]
   */
  abstract getTxType(): number

  /**
   * Returns the NetworkID as a number
   */
  getNetworkID(): number {
    return this.networkID.readUInt32BE(0)
  }

  /**
   * Returns the Buffer representation of the BlockchainID
   */
  getBlockchainID(): Buffer {
    return this.blockchainID
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardBaseTx]].
   */
  toBuffer(): Buffer {
    let bsize: number = this.networkID.length + this.blockchainID.length
    const barr: Buffer[] = [this.networkID, this.blockchainID]
    const buff: Buffer = Buffer.concat(barr, bsize)
    return buff
  }

  /**
   * Returns a base-58 representation of the [[StandardBaseTx]].
   */
  toString(): string {
    return bintools.bufferToB58(this.toBuffer())
  }

  abstract clone(): this

  abstract create(...args: any[]): this

  abstract select(id: number, ...args: any[]): this

  /**
   * Class representing a StandardBaseTx which is the foundation for all transactions.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16)
  ) {
    super()
    this.networkID.writeUInt32BE(networkID, 0)
    this.blockchainID = blockchainID
  }
}

/**
 * Class representing an unsigned transaction.
 */
export abstract class EVMStandardUnsignedTx<
  KPClass extends StandardKeyPair,
  KCClass extends StandardKeyChain<KPClass>,
  SBTx extends EVMStandardBaseTx<KPClass, KCClass>
> extends Serializable {
  protected _typeName = "StandardUnsignedTx"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      codecID: serializer.encoder(
        this.codecID,
        encoding,
        "number",
        "decimalString",
        2
      ),
      transaction: this.transaction.serialize(encoding)
    }
  }

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.codecID = serializer.decoder(
      fields["codecID"],
      encoding,
      "decimalString",
      "number"
    )
  }

  protected codecID: number = 0
  protected transaction: SBTx

  /**
   * Returns the CodecID as a number
   */
  getCodecID(): number {
    return this.codecID
  }

  /**
   * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the CodecID
   */
  getCodecIDBuffer(): Buffer {
    let codecBuf: Buffer = Buffer.alloc(2)
    codecBuf.writeUInt16BE(this.codecID, 0)
    return codecBuf
  }

  /**
   * Returns the inputTotal as a BN
   */
  getInputTotal(assetID: Buffer): BN {
    const ins: StandardTransferableInput[] = []
    const aIDHex: string = assetID.toString("hex")
    let total: BN = new BN(0)
    ins.forEach((input: StandardTransferableInput) => {
      // only check StandardAmountInputs
      if (
        input.getInput() instanceof StandardAmountInput &&
        aIDHex === input.getAssetID().toString("hex")
      ) {
        const i = input.getInput() as StandardAmountInput
        total = total.add(i.getAmount())
      }
    })
    return total
  }

  /**
   * Returns the outputTotal as a BN
   */
  getOutputTotal(assetID: Buffer): BN {
    const outs: StandardTransferableOutput[] = []
    const aIDHex: string = assetID.toString("hex")
    let total: BN = new BN(0)

    outs.forEach((out: StandardTransferableOutput) => {
      // only check StandardAmountOutput
      if (
        out.getOutput() instanceof StandardAmountOutput &&
        aIDHex === out.getAssetID().toString("hex")
      ) {
        const output: StandardAmountOutput =
          out.getOutput() as StandardAmountOutput
        total = total.add(output.getAmount())
      }
    })
    return total
  }

  /**
   * Returns the number of burned tokens as a BN
   */
  getBurn(assetID: Buffer): BN {
    return this.getInputTotal(assetID).sub(this.getOutputTotal(assetID))
  }

  /**
   * Returns the Transaction
   */
  abstract getTransaction(): SBTx

  abstract fromBuffer(bytes: Buffer, offset?: number): number

  toBuffer(): Buffer {
    const codecID: Buffer = this.getCodecIDBuffer()
    const txtype: Buffer = Buffer.alloc(4)
    txtype.writeUInt32BE(this.transaction.getTxType(), 0)
    const basebuff: Buffer = this.transaction.toBuffer()
    return Buffer.concat(
      [codecID, txtype, basebuff],
      codecID.length + txtype.length + basebuff.length
    )
  }

  /**
   * Signs this [[UnsignedTx]] and returns signed [[StandardTx]]
   *
   * @param kc An [[KeyChain]] used in signing
   *
   * @returns A signed [[StandardTx]]
   */
  abstract sign(
    kc: KCClass
  ): EVMStandardTx<
    KPClass,
    KCClass,
    EVMStandardUnsignedTx<KPClass, KCClass, SBTx>
  >

  constructor(transaction: SBTx = undefined, codecID: number = 0) {
    super()
    this.codecID = codecID
    this.transaction = transaction
  }
}

/**
 * Class representing a signed transaction.
 */
export abstract class EVMStandardTx<
  KPClass extends StandardKeyPair,
  KCClass extends StandardKeyChain<KPClass>,
  SUBTx extends EVMStandardUnsignedTx<
    KPClass,
    KCClass,
    EVMStandardBaseTx<KPClass, KCClass>
  >
> extends Serializable {
  protected _typeName = "StandardTx"
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      unsignedTx: this.unsignedTx.serialize(encoding),
      credentials: this.credentials.map((c) => c.serialize(encoding))
    }
  }

  protected unsignedTx: SUBTx = undefined
  protected credentials: Credential[] = []

  /**
   * Returns the [[StandardUnsignedTx]]
   */
  getUnsignedTx(): SUBTx {
    return this.unsignedTx
  }

  abstract fromBuffer(bytes: Buffer, offset?: number): number

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardTx]].
   */
  toBuffer(): Buffer {
    const txbuff: Buffer = this.unsignedTx.toBuffer()
    let bsize: number = txbuff.length
    const credlen: Buffer = Buffer.alloc(4)
    credlen.writeUInt32BE(this.credentials.length, 0)
    const barr: Buffer[] = [txbuff, credlen]
    bsize += credlen.length
    this.credentials.forEach((credential: Credential) => {
      const credid: Buffer = Buffer.alloc(4)
      credid.writeUInt32BE(credential.getCredentialID(), 0)
      barr.push(credid)
      bsize += credid.length
      const credbuff: Buffer = credential.toBuffer()
      bsize += credbuff.length
      barr.push(credbuff)
    })
    const buff: Buffer = Buffer.concat(barr, bsize)
    return buff
  }

  /**
   * Takes a base-58 string containing an [[StandardTx]], parses it, populates the class, and returns the length of the Tx in bytes.
   *
   * @param serialized A base-58 string containing a raw [[StandardTx]]
   *
   * @returns The length of the raw [[StandardTx]]
   *
   * @remarks
   * unlike most fromStrings, it expects the string to be serialized in cb58 format
   */
  fromString(serialized: string): number {
    return this.fromBuffer(bintools.cb58Decode(serialized))
  }

  /**
   * Returns a cb58 representation of the [[StandardTx]].
   *
   * @remarks
   * unlike most toStrings, this returns in cb58 serialization format
   */
  toString(): string {
    return bintools.cb58Encode(this.toBuffer())
  }

  toStringHex(): string {
    return `0x${bintools.addChecksum(this.toBuffer()).toString("hex")}`
  }

  /**
   * Class representing a signed transaction.
   *
   * @param unsignedTx Optional [[StandardUnsignedTx]]
   * @param signatures Optional array of [[Credential]]s
   */
  constructor(
    unsignedTx: SUBTx = undefined,
    credentials: Credential[] = undefined
  ) {
    super()
    if (typeof unsignedTx !== "undefined") {
      this.unsignedTx = unsignedTx
      if (typeof credentials !== "undefined") {
        this.credentials = credentials
      }
    }
  }
}
