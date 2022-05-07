/**
 * @packageDocumentation
 * @module API-EVM-BaseTx
 */

import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { KeyChain, KeyPair } from "./keychain"
import { EVMStandardBaseTx } from "../../common/evmtx"
import { Credential } from "../../common/credentials"
import { DefaultNetworkID } from "../../utils/constants"
import { SelectTxClass } from "./tx"
import { SerializedEncoding } from "../../utils/serialization"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

/**
 * Class representing a base for all transactions.
 */
export class EVMBaseTx extends EVMStandardBaseTx<KeyPair, KeyChain> {
  protected _typeName = "BaseTx"
  protected _typeID = undefined

  //serialize is inherited

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
  }

  /**
   * Returns the id of the [[BaseTx]]
   */
  getTxType(): number {
    return this._typeID
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
    return creds
  }

  clone(): this {
    const newEVMBaseTx: EVMBaseTx = new EVMBaseTx()
    newEVMBaseTx.fromBuffer(this.toBuffer())
    return newEVMBaseTx as this
  }

  create(...args: any[]): this {
    return new EVMBaseTx(...args) as this
  }

  select(id: number, ...args: any[]): this {
    const newEVMBaseTx: EVMBaseTx = SelectTxClass(id, ...args)
    return newEVMBaseTx as this
  }

  /**
   * Class representing an EVMBaseTx which is the foundation for all EVM transactions.
   *
   * @param networkID Optional networkID, [[DefaultNetworkID]]
   * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
   */
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16)
  ) {
    super(networkID, blockchainID)
  }
}
