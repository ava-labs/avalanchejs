/**
 * @packageDocumentation
 * @module API-PlatformVM-UTXOs
 */
import { Buffer } from "buffer/"
import BinTools from "../../utils/bintools"
import BN from "bn.js"
import {
  AmountOutput,
  SelectOutputClass,
  TransferableOutput,
  ParseableOutput,
  StakeableLockOut,
  SECPTransferOutput,
  LockedOut
} from "./outputs"
import {
  SECPTransferInput,
  StakeableLockIn,
  TransferableInput,
  ParseableInput
} from "./inputs"
import { UnixNow } from "../../utils/helperfunctions"
import { StandardUTXO, StandardUTXOSet } from "../../common/utxos"
import { PlatformVMConstants } from "./constants"
import {
  StandardAssetAmountDestination,
  AssetAmount
} from "../../common/assetamount"
import { BaseInput } from "../../common/input"
import { BaseOutput, OutputOwners } from "../../common/output"
import { Serialization, SerializedEncoding } from "../../utils/serialization"
import {
  UTXOError,
  AddressError,
  InsufficientFundsError,
  TimeError,
  UnknownFormatError
} from "../../utils/errors"
import { LockMode } from "./builder"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

const zeroBN = new BN(0)

/**
 * Class for representing a single UTXO.
 */
export class UTXO extends StandardUTXO {
  protected _typeName = "UTXO"
  protected _typeID = undefined

  //serialize is inherited

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.output = SelectOutputClass(fields["output"]["_typeID"])
    this.output.deserialize(fields["output"], encoding)
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.codecID = bintools.copyFrom(bytes, offset, offset + 2)
    offset += 2
    this.txid = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    this.outputidx = bintools.copyFrom(bytes, offset, offset + 4)
    offset += 4
    this.assetID = bintools.copyFrom(bytes, offset, offset + 32)
    offset += 32
    const outputid: number = bintools
      .copyFrom(bytes, offset, offset + 4)
      .readUInt32BE(0)
    offset += 4
    this.output = SelectOutputClass(outputid)
    return this.output.fromBuffer(bytes, offset)
  }

  /**
   * Takes a base-58 or hex string containing a [[UTXO]], parses it, populates the class, and returns the length of the StandardUTXO in bytes.
   *
   * @param serialized A base-58 string containing a raw [[UTXO]]
   * @param format The format of the encoded [[UTXO]] (cb58 or hex). Defaults to cb58 per existing codebase
   *
   * @returns The length of the raw [[UTXO]]
   *
   * @remarks
   * Default encoding format is cb58, if providing hex encoded string please specify format as 'hex'
   */
  fromString(serialized: string, format: string = "cb58"): number {
    switch (format) {
      case "cb58": {
        /* istanbul ignore next */
        return this.fromBuffer(bintools.cb58Decode(serialized))
      }
      case "hex": {
        let decoded = serialization.decoder(serialized, "hex", "hex", "cb58")
        this.fromString(decoded)
        return this.toBuffer().length
      }
      default: {
        throw new UnknownFormatError(
          `Specified format '${format}' is unknown, should be hex or cb58.`
        )
      }
    }
  }

  /**
   * Returns a base-58 representation of the [[UTXO]].
   *
   * @param format The format of the encoded [[UTXO]] (cb58 or hex). Defaults to cb58 per existing codebase
   *
   * @remarks
   * Default encoding format to cb58, if you want a hex encoded output please specify format as 'hex'
   */
  toString(format: string = "cb58"): string {
    switch (format) {
      case "cb58": {
        /* istanbul ignore next */
        return bintools.cb58Encode(this.toBuffer())
      }
      case "hex": {
        return serialization.encoder(
          bintools.cb58Encode(this.toBuffer()),
          "hex",
          "cb58",
          "hex"
        )
      }
      default: {
        throw new UnknownFormatError(
          `Specified format '${format}' is unknown, should be hex or cb58.`
        )
      }
    }
  }

  clone(): this {
    const utxo: UTXO = new UTXO()
    utxo.fromBuffer(this.toBuffer())
    return utxo as this
  }

  create(
    codecID: number = PlatformVMConstants.LATESTCODEC,
    txid: Buffer = undefined,
    outputidx: Buffer | number = undefined,
    assetID: Buffer = undefined,
    output: BaseOutput = undefined
  ): this {
    return new UTXO(codecID, txid, outputidx, assetID, output) as this
  }
}

export class AssetAmountDestination extends StandardAssetAmountDestination<
  TransferableOutput,
  TransferableInput
> {
  protected signers: Buffer[]
  protected outputOwners: OutputOwners[] = []

  getSigners = (): Buffer[] => this.signers

  setOutputOwners = (owners: OutputOwners[]) => (this.outputOwners = owners)
  getOutputOwners = (): OutputOwners[] => this.outputOwners

  constructor(
    destinations: Buffer[],
    destinationsThreshold: number,
    senders: Buffer[],
    signers: Buffer[],
    changeAddresses: Buffer[],
    changeAddressesThreshold: number
  ) {
    super(
      destinations,
      destinationsThreshold,
      senders,
      changeAddresses,
      changeAddressesThreshold
    )
    this.signers = signers
  }
}

/**
 * Class representing a set of [[UTXO]]s.
 */
export class UTXOSet extends StandardUTXOSet<UTXO> {
  protected _typeName = "UTXOSet"
  protected _typeID = undefined

  //serialize is inherited

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    let utxos = {}
    for (let utxoid in fields["utxos"]) {
      let utxoidCleaned: string = serialization.decoder(
        utxoid,
        encoding,
        "base58",
        "base58"
      )
      utxos[`${utxoidCleaned}`] = new UTXO()
      utxos[`${utxoidCleaned}`].deserialize(
        fields["utxos"][`${utxoid}`],
        encoding
      )
    }
    let addressUTXOs = {}
    for (let address in fields["addressUTXOs"]) {
      let addressCleaned: string = serialization.decoder(
        address,
        encoding,
        "cb58",
        "hex"
      )
      let utxobalance = {}
      for (let utxoid in fields["addressUTXOs"][`${address}`]) {
        let utxoidCleaned: string = serialization.decoder(
          utxoid,
          encoding,
          "base58",
          "base58"
        )
        utxobalance[`${utxoidCleaned}`] = serialization.decoder(
          fields["addressUTXOs"][`${address}`][`${utxoid}`],
          encoding,
          "decimalString",
          "BN"
        )
      }
      addressUTXOs[`${addressCleaned}`] = utxobalance
    }
    this.utxos = utxos
    this.addressUTXOs = addressUTXOs
  }

  parseUTXO(utxo: UTXO | string): UTXO {
    const utxovar: UTXO = new UTXO()
    // force a copy
    if (typeof utxo === "string") {
      utxovar.fromBuffer(bintools.cb58Decode(utxo))
    } else if (utxo instanceof StandardUTXO) {
      utxovar.fromBuffer(utxo.toBuffer()) // forces a copy
    } else {
      /* istanbul ignore next */
      throw new UTXOError(
        "Error - UTXO.parseUTXO: utxo parameter is not a UTXO or string"
      )
    }
    return utxovar
  }

  create(...args: any[]): this {
    return new UTXOSet() as this
  }

  clone(): this {
    const newset: UTXOSet = this.create()
    const allUTXOs: UTXO[] = this.getAllUTXOs()
    newset.addArray(allUTXOs)
    return newset as this
  }

  _feeCheck(fee: BN, feeAssetID: Buffer): boolean {
    return (
      typeof fee !== "undefined" &&
      typeof feeAssetID !== "undefined" &&
      fee.gt(new BN(0)) &&
      feeAssetID instanceof Buffer
    )
  }

  getConsumableUXTO = (
    asOf: BN = UnixNow(),
    stakeable: boolean = false
  ): UTXO[] => {
    return this.getAllUTXOs().filter((utxo: UTXO) => {
      if (stakeable) {
        // stakeable transactions can consume any UTXO.
        return true
      }
      const output: BaseOutput = utxo.getOutput()
      if (!(output instanceof StakeableLockOut)) {
        // non-stakeable transactions can consume any UTXO that isn't locked.
        return true
      }
      const stakeableOutput: StakeableLockOut = output as StakeableLockOut
      if (stakeableOutput.getStakeableLocktime().lt(asOf)) {
        // If the stakeable outputs locktime has ended, then this UTXO can still
        // be consumed by a non-stakeable transaction.
        return true
      }
      // This output is locked and can't be consumed by a non-stakeable
      // transaction.
      return false
    })
  }

  getLockedTxIDs = (): { depositIDs: string[]; bondIDs: string[] } => {
    const d = new Set<string>(),
      b = new Set<string>()
    this.getAllUTXOs().forEach((utxo: UTXO) => {
      const output: BaseOutput = utxo.getOutput()
      if (output instanceof LockedOut) {
        var id = output.getLockedIDs().getDepositTxID()
        if (!id.isEmpty()) d.add(id.encode("cb58"))
        id = output.getLockedIDs().getBondTxID()
        if (!id.isEmpty()) b.add(id.encode("cb58"))
      }
    })
    return { depositIDs: [...d.keys()], bondIDs: [...b.keys()] }
  }

  getMinimumSpendable = async (
    aad: AssetAmountDestination,
    asOf: BN = zeroBN,
    lockTime: BN = zeroBN,
    lockMode: LockMode = "Unlocked"
  ): Promise<Error> => {
    if (asOf.isZero()) asOf = UnixNow()

    let utxoArray: UTXO[] = this.getConsumableUXTO(asOf, lockMode == "Stake")
    let tmpUTXOArray: UTXO[] = []
    if (lockMode == "Stake") {
      // If this is a stakeable transaction then have StakeableLockOut come before SECPTransferOutput
      // so that users first stake locked tokens before staking unlocked tokens
      utxoArray.forEach((utxo: UTXO) => {
        // StakeableLockOuts
        if (utxo.getOutput().getTypeID() === 22) {
          tmpUTXOArray.push(utxo)
        }
      })

      // Sort the StakeableLockOuts by StakeableLocktime so that the greatest StakeableLocktime are spent first
      tmpUTXOArray.sort((a: UTXO, b: UTXO) => {
        let stakeableLockOut1 = a.getOutput() as StakeableLockOut
        let stakeableLockOut2 = b.getOutput() as StakeableLockOut
        return (
          stakeableLockOut2.getStakeableLocktime().toNumber() -
          stakeableLockOut1.getStakeableLocktime().toNumber()
        )
      })

      utxoArray.forEach((utxo: UTXO) => {
        // SECPTransferOutputs
        if (utxo.getOutput().getTypeID() === 7) {
          tmpUTXOArray.push(utxo)
        }
      })
      utxoArray = tmpUTXOArray
    }

    // outs is a map from assetID to a tuple of (lockedStakeable, unlocked)
    // which are arrays of outputs.
    const outs: object = {}

    // We only need to iterate over UTXOs until we have spent sufficient funds
    // to met the requested amounts.
    utxoArray.forEach((utxo: UTXO) => {
      const assetID: Buffer = utxo.getAssetID()
      const assetKey: string = assetID.toString("hex")
      const fromAddresses: Buffer[] = aad.getSenders()
      const output: BaseOutput = utxo.getOutput()
      const amountOutput =
        output instanceof ParseableOutput ? output.getOutput() : output
      if (
        !(amountOutput instanceof AmountOutput) ||
        !aad.assetExists(assetKey) ||
        !output.meetsThreshold(fromAddresses, asOf)
      ) {
        // We should only try to spend fungible assets.
        // We should only spend {{ assetKey }}.
        // We need to be able to spend the output.
        return
      }

      const assetAmount: AssetAmount = aad.getAssetAmount(assetKey)
      if (assetAmount.isFinished()) {
        // We've already spent the needed UTXOs for this assetID.
        return
      }

      if (!(assetKey in outs)) {
        // If this is the first time spending this assetID, we need to
        // initialize the outs object correctly.
        outs[`${assetKey}`] = {
          lockedStakeable: [],
          unlocked: []
        }
      }

      // amount is the amount of funds available from this UTXO.
      const amount = amountOutput.getAmount()

      // Set up the SECP input with the same amount as the output.
      let input: BaseInput = new SECPTransferInput(amount)

      let locked: boolean = false
      if (output instanceof StakeableLockOut) {
        const stakeableOutput: StakeableLockOut = output as StakeableLockOut
        const stakeableLocktime: BN = stakeableOutput.getStakeableLocktime()

        if (stakeableLocktime.gt(asOf)) {
          // Add a new input and mark it as being locked.
          input = new StakeableLockIn(
            amount,
            stakeableLocktime,
            new ParseableInput(input)
          )

          // Mark this UTXO as having been re-locked.
          locked = true
        }
      }

      assetAmount.spendAmount(amount, locked)
      if (locked) {
        // Track the UTXO as locked.
        outs[`${assetKey}`].lockedStakeable.push(output)
      } else {
        // Track the UTXO as unlocked.
        outs[`${assetKey}`].unlocked.push(output)
      }

      // Get the indices of the outputs that should be used to authorize the
      // spending of this input.

      // TODO: getSpenders should return an array of indices rather than an
      // array of addresses.
      const spenders: Buffer[] = amountOutput.getSpenders(fromAddresses, asOf)
      spenders.forEach((spender: Buffer) => {
        const idx: number = amountOutput.getAddressIdx(spender)
        if (idx === -1) {
          // This should never happen, which is why the error is thrown rather
          // than being returned. If this were to ever happen this would be an
          // error in the internal logic rather having called this function with
          // invalid arguments.

          /* istanbul ignore next */
          throw new AddressError(
            "Error - UTXOSet.getMinimumSpendable: no such " +
              `address in output: ${spender}`
          )
        }
        input.addSignatureIdx(idx, spender)
      })

      const txID: Buffer = utxo.getTxID()
      const outputIdx: Buffer = utxo.getOutputIdx()
      const transferInput: TransferableInput = new TransferableInput(
        txID,
        outputIdx,
        assetID,
        input
      )
      aad.addInput(transferInput)
    })

    if (!aad.canComplete()) {
      // After running through all the UTXOs, we still weren't able to get all
      // the necessary funds, so this transaction can't be made.
      return new InsufficientFundsError(
        "Error - UTXOSet.getMinimumSpendable: insufficient " +
          "funds to create the transaction"
      )
    }

    // TODO: We should separate the above functionality into a single function
    // that just selects the UTXOs to consume.

    const zero: BN = new BN(0)

    // assetAmounts is an array of asset descriptions and how much is left to
    // spend for them.
    const assetAmounts: AssetAmount[] = aad.getAmounts()
    assetAmounts.forEach((assetAmount: AssetAmount) => {
      // change is the amount that should be returned back to the source of the
      // funds.
      const change: BN = assetAmount.getChange()
      // isStakeableLockChange is if the change is locked or not.
      const isStakeableLockChange: boolean =
        assetAmount.getStakeableLockChange()
      // lockedChange is the amount of locked change that should be returned to
      // the sender
      const lockedChange: BN = isStakeableLockChange ? change : zero.clone()

      const assetID: Buffer = assetAmount.getAssetID()
      const assetKey: string = assetAmount.getAssetIDString()
      const lockedOutputs: StakeableLockOut[] =
        outs[`${assetKey}`].lockedStakeable
      lockedOutputs.forEach((lockedOutput: StakeableLockOut, i: number) => {
        const stakeableLocktime: BN = lockedOutput.getStakeableLocktime()

        // We know that parseableOutput contains an AmountOutput because the
        // first loop filters for fungible assets.
        const output: AmountOutput = lockedOutput.getOutput() as AmountOutput

        let outputAmountRemaining: BN = output.getAmount()
        // The only output that could generate change is the last output.
        // Otherwise, any further UTXOs wouldn't have needed to be spent.
        if (i == lockedOutputs.length - 1 && lockedChange.gt(zero)) {
          // update outputAmountRemaining to no longer hold the change that we
          // are returning.
          outputAmountRemaining = outputAmountRemaining.sub(lockedChange)
          let newLockedChangeOutput: StakeableLockOut = SelectOutputClass(
            lockedOutput.getOutputID(),
            lockedChange,
            output.getAddresses(),
            output.getLocktime(),
            output.getThreshold(),
            stakeableLocktime
          ) as StakeableLockOut
          const transferOutput: TransferableOutput = new TransferableOutput(
            assetID,
            newLockedChangeOutput
          )
          aad.addChange(transferOutput)
        }

        // We know that outputAmountRemaining > 0. Otherwise, we would never
        // have consumed this UTXO, as it would be only change.
        const newLockedOutput: StakeableLockOut = SelectOutputClass(
          lockedOutput.getOutputID(),
          outputAmountRemaining,
          output.getAddresses(),
          output.getLocktime(),
          output.getThreshold(),
          stakeableLocktime
        ) as StakeableLockOut
        const transferOutput: TransferableOutput = new TransferableOutput(
          assetID,
          newLockedOutput
        )
        aad.addOutput(transferOutput)
      })

      // unlockedChange is the amount of unlocked change that should be returned
      // to the sender
      const unlockedChange: BN = isStakeableLockChange ? zero.clone() : change
      if (unlockedChange.gt(zero)) {
        const newChangeOutput: AmountOutput = new SECPTransferOutput(
          unlockedChange,
          aad.getChangeAddresses(),
          zero.clone(), // make sure that we don't lock the change output.
          aad.getChangeAddressesThreshold()
        ) as AmountOutput
        const transferOutput: TransferableOutput = new TransferableOutput(
          assetID,
          newChangeOutput
        )
        aad.addChange(transferOutput)
      }

      // totalAmountSpent is the total amount of tokens consumed.
      const totalAmountSpent: BN = assetAmount.getSpent()
      // stakeableLockedAmount is the total amount of locked tokens consumed.
      const stakeableLockedAmount: BN = assetAmount.getStakeableLockSpent()
      // totalUnlockedSpent is the total amount of unlocked tokens consumed.
      const totalUnlockedSpent: BN = totalAmountSpent.sub(stakeableLockedAmount)
      // amountBurnt is the amount of unlocked tokens that must be burn.
      const amountBurnt: BN = assetAmount.getBurn()
      // totalUnlockedAvailable is the total amount of unlocked tokens available
      // to be produced.
      const totalUnlockedAvailable: BN = totalUnlockedSpent.sub(amountBurnt)
      // unlockedAmount is the amount of unlocked tokens that should be sent.
      const unlockedAmount: BN = totalUnlockedAvailable.sub(unlockedChange)
      if (unlockedAmount.gt(zero)) {
        const newOutput: AmountOutput = new SECPTransferOutput(
          unlockedAmount,
          aad.getDestinations(),
          lockTime,
          aad.getDestinationsThreshold()
        ) as AmountOutput
        const transferOutput: TransferableOutput = new TransferableOutput(
          assetID,
          newOutput
        )
        aad.addOutput(transferOutput)
      }
    })
    return undefined
  }
}
