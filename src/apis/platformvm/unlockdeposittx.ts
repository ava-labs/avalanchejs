/**
 * @packageDocumentation
 * @module API-PlatformVM-UnlockDepositTx
 */
import { PlatformVMConstants } from "./constants"
import { BaseTx } from "./basetx"

/**
 * Class representing an unsigned UnlockDepositTx transaction.
 */
export class UnlockDepositTx extends BaseTx {
  protected _typeName = "UnlockDepositTx"
  protected _typeID = PlatformVMConstants.UNLOCKDEPOSITTX

  /**
   * Returns the id of the [[UnlockDepositTx]]
   */
  getTxType(): number {
    return this._typeID
  }

  clone(): this {
    const newUnlockDepositTx: UnlockDepositTx = new UnlockDepositTx()
    newUnlockDepositTx.fromBuffer(this.toBuffer())
    return newUnlockDepositTx as this
  }

  create(...args: any[]): this {
    return new UnlockDepositTx(...args) as this
  }
}
