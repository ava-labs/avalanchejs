/**
 * @packageDocumentation
 * @module Common-AssetAmount
 */

import { Buffer } from "buffer/"
import BN from "bn.js"
import { StandardTransferableOutput } from "./output"
import { StandardTransferableInput } from "./input"
import { InsufficientFundsError } from "../utils/errors"

/**
 * Class for managing asset amounts in the UTXOSet fee calcuation
 */
export class AssetAmount {
  // assetID that is amount is managing.
  protected assetID: Buffer = Buffer.alloc(32)
  // amount of this asset that should be sent.
  protected amount: BN = new BN(0)
  // burn is the amount of this asset that should be burned.
  protected burn: BN = new BN(0)

  // spent is the total amount of this asset that has been consumed.
  protected spent: BN = new BN(0)
  // stakeableLockSpent is the amount of this asset that has been consumed that
  // was locked.
  protected stakeableLockSpent: BN = new BN(0)

  // change is the excess amount of this asset that was consumed over the amount
  // requested to be consumed(amount + burn).
  protected change: BN = new BN(0)
  // stakeableLockChange is a flag to mark if the input that generated the
  // change was locked.
  protected stakeableLockChange: boolean = false

  // finished is a convenience flag to track "spent >= amount + burn"
  protected finished: boolean = false

  getAssetID = (): Buffer => {
    return this.assetID
  }

  getAssetIDString = (): string => {
    return this.assetID.toString("hex")
  }

  getAmount = (): BN => {
    return this.amount
  }

  getSpent = (): BN => {
    return this.spent
  }

  getBurn = (): BN => {
    return this.burn
  }

  getChange = (): BN => {
    return this.change
  }

  getStakeableLockSpent = (): BN => {
    return this.stakeableLockSpent
  }

  getStakeableLockChange = (): boolean => {
    return this.stakeableLockChange
  }

  isFinished = (): boolean => {
    return this.finished
  }

  // spendAmount should only be called if this asset is still awaiting more
  // funds to consume.
  spendAmount = (amt: BN, stakeableLocked: boolean = false): boolean => {
    if (this.finished) {
      /* istanbul ignore next */
      throw new InsufficientFundsError(
        "Error - AssetAmount.spendAmount: attempted to spend " + "excess funds"
      )
    }
    this.spent = this.spent.add(amt)
    if (stakeableLocked) {
      this.stakeableLockSpent = this.stakeableLockSpent.add(amt)
    }

    const total: BN = this.amount.add(this.burn)
    if (this.spent.gte(total)) {
      this.change = this.spent.sub(total)
      if (stakeableLocked) {
        this.stakeableLockChange = true
      }
      this.finished = true
    }
    return this.finished
  }

  constructor(assetID: Buffer, amount: BN, burn: BN) {
    this.assetID = assetID
    this.amount = typeof amount === "undefined" ? new BN(0) : amount
    this.burn = typeof burn === "undefined" ? new BN(0) : burn
    this.spent = new BN(0)
    this.stakeableLockSpent = new BN(0)
    this.stakeableLockChange = false
  }
}

export abstract class StandardAssetAmountDestination<
  TO extends StandardTransferableOutput,
  TI extends StandardTransferableInput
> {
  protected amounts: AssetAmount[] = []
  protected destinations: Buffer[] = []
  protected senders: Buffer[] = []
  protected changeAddresses: Buffer[] = []
  protected amountkey: object = {}
  protected inputs: TI[] = []
  protected outputs: TO[] = []
  protected change: TO[] = []

  // TODO: should this function allow for repeated calls with the same
  //       assetID?
  addAssetAmount = (assetID: Buffer, amount: BN, burn: BN) => {
    let aa: AssetAmount = new AssetAmount(assetID, amount, burn)
    this.amounts.push(aa)
    this.amountkey[aa.getAssetIDString()] = aa
  }

  addInput = (input: TI) => {
    this.inputs.push(input)
  }

  addOutput = (output: TO) => {
    this.outputs.push(output)
  }

  addChange = (output: TO) => {
    this.change.push(output)
  }

  getAmounts = (): AssetAmount[] => {
    return this.amounts
  }

  getDestinations = (): Buffer[] => {
    return this.destinations
  }

  getSenders = (): Buffer[] => {
    return this.senders
  }

  getChangeAddresses = (): Buffer[] => {
    return this.changeAddresses
  }

  getAssetAmount = (assetHexStr: string): AssetAmount => {
    return this.amountkey[`${assetHexStr}`]
  }

  assetExists = (assetHexStr: string): boolean => {
    return assetHexStr in this.amountkey
  }

  getInputs = (): TI[] => {
    return this.inputs
  }

  getOutputs = (): TO[] => {
    return this.outputs
  }

  getChangeOutputs = (): TO[] => {
    return this.change
  }

  getAllOutputs = (): TO[] => {
    return this.outputs.concat(this.change)
  }

  canComplete = (): boolean => {
    for (let i: number = 0; i < this.amounts.length; i++) {
      if (!this.amounts[`${i}`].isFinished()) {
        return false
      }
    }
    return true
  }

  constructor(
    destinations: Buffer[],
    senders: Buffer[],
    changeAddresses: Buffer[]
  ) {
    this.destinations = destinations
    this.changeAddresses = changeAddresses
    this.senders = senders
  }
}
