/**
 * @packageDocumentation
 * @module Common-UpgradeVersionID
 */

import { Buffer } from "buffer/"
import BN from "bn.js"

import BinTools from "../utils/bintools"
import { ZeroBN } from "./utils"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const UpgradeVersionPrefix = new BN([
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00
])
const VersionMask = new BN([0xff, 0xff])
const UpgradeVersionLen = 8

/**
 * Class for representing a UpgradeVersionID
 */
export class UpgradeVersionID {
  protected upgradeVersionID = ZeroBN

  version(): number {
    return this.upgradeVersionID.and(VersionMask).toNumber()
  }

  clone(): this {
    return new UpgradeVersionID(this.version()) as this
  }

  create(): this {
    return new UpgradeVersionID() as this
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    const b = bintools.copyFrom(bytes, offset, offset + UpgradeVersionLen)
    const v = bintools.fromBufferToBN(b)
    if (v.and(UpgradeVersionPrefix).eq(UpgradeVersionPrefix)) {
      this.upgradeVersionID = v
      return offset + UpgradeVersionLen
    }
    return offset
  }

  toBuffer(): Buffer {
    if (this.version() > 0) {
      return bintools.fromBNToBuffer(this.upgradeVersionID, UpgradeVersionLen)
    }
    return Buffer.alloc(0)
  }

  constructor(version: number = 0) {
    if (version > 0) {
      this.upgradeVersionID = UpgradeVersionPrefix.or(new BN(version))
    }
  }
}
