/**
 * @packageDocumentation
 * @module API-PlatformVM-Locked
 */

import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import { Serialization, SerializedEncoding } from "../../utils/serialization"

const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

export class SerializableTxID {
  encode(encoding: SerializedEncoding = "hex"): string {
    return serialization.encoder(this.txid, encoding, "Buffer", "cb58")
  }

  decode(value: string, encoding: SerializedEncoding = "hex") {
    this.txid = serialization.decoder(value, encoding, "cb58", "Buffer", 32)
  }

  protected txid: Buffer = Buffer.alloc(32)

  isEmpty(): boolean {
    return this.txid.equals(Buffer.alloc(32))
  }

  fromBuffer(bytes: Buffer, offset = 0): number {
    this.txid = bintools.copyFrom(bytes, offset, offset + 32)
    return offset + 32
  }

  toBuffer(): Buffer {
    return this.txid
  }
}

export class LockedIDs {
  serialize(encoding: SerializedEncoding = "hex"): object {
    let lockObj: object = {
      depositTxID: this.depositTxID.encode(encoding),
      bondTxID: this.bondTxID.encode(encoding)
    }
    return lockObj
  }

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    this.depositTxID.decode(fields["depositTxID"])
    this.bondTxID.decode(fields["bondTxID"])
  }

  protected depositTxID: SerializableTxID = new SerializableTxID()
  protected bondTxID: SerializableTxID = new SerializableTxID()

  getDepositTxID(): SerializableTxID {
    return this.depositTxID
  }
  getBondTxID(): SerializableTxID {
    return this.bondTxID
  }

  fromBuffer(bytes: Buffer, offset = 0): number {
    offset = this.depositTxID.fromBuffer(bytes, offset)
    offset = this.bondTxID.fromBuffer(bytes, offset)
    return offset
  }

  toBuffer(): Buffer {
    return Buffer.concat(
      [this.depositTxID.toBuffer(), this.bondTxID.toBuffer()],
      64
    )
  }

  /**
   * Class representing an [[LockedIDs]] for LockedIn and LockedOut types.
   *
   * @param depositTxID txID where this Output is deposited on
   * @param bondTxID txID where this Output is bonded on
   */
  constructor(depositTxID?: Buffer, bondTxID?: Buffer) {
    if (depositTxID) this.depositTxID.fromBuffer(depositTxID)
    if (bondTxID) this.bondTxID.fromBuffer(bondTxID)
  }
}
