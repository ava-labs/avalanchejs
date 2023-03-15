/**
 * @packageDocumentation
 * @module API-PlatformVM-Builder
 */

import BN from "bn.js"

import { Buffer } from "buffer/"
import { OutputOwners } from "../../common/output"
import { DefaultNetworkID, UnixNow } from "../../utils"
import {
  AddressError,
  FeeAssetError,
  ProtocolError,
  ThresholdError,
  TimeError
} from "../../utils/errors"
import {
  AddDelegatorTx,
  AddSubnetValidatorTx,
  AddValidatorTx,
  AmountOutput,
  AssetAmountDestination,
  BaseTx,
  CaminoAddValidatorTx,
  CreateChainTx,
  CreateSubnetTx,
  ExportTx,
  ImportTx,
  ParseableOutput,
  RegisterNodeTx,
  SECPOwnerOutput,
  SECPTransferInput,
  SECPTransferOutput,
  SelectOutputClass,
  TransferableInput,
  TransferableOutput,
  UnsignedTx,
  UTXO
} from "."
import { GenesisData } from "../avm"
import { DepositTx } from "./depositTx"
import { AddressStateTx } from "./addressstatetx"

export type LockMode = "Unlocked" | "Bond" | "Deposit" | "Stake"

export interface MinimumSpendable {
  getMinimumSpendable(
    aad: AssetAmountDestination,
    asOf: BN,
    locktime: BN,
    lockMode: LockMode
  ): Promise<Error>
}

const zero: BN = new BN(0)

export class Builder {
  spender: MinimumSpendable
  caminoEnabled: boolean

  constructor(spender: MinimumSpendable, caminoEnabled: boolean) {
    this.spender = spender
    this.caminoEnabled = caminoEnabled
  }

  /**
   * Creates an [[UnsignedTx]] wrapping a [[BaseTx]]. For more granular control, you may create your own
   * [[UnsignedTx]] wrapping a [[BaseTx]] manually (with their corresponding [[TransferableInput]]s and [[TransferableOutput]]s).
   *
   * @param networkID The number representing NetworkID of the node
   * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
   * @param amount The amount of the asset to be spent in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}.
   * @param assetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for the UTXO
   * @param toAddresses The addresses to send the funds
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs. Default: toAddresses
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned. Default: assetID
   * @param memo Optional. Contains arbitrary data, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param locktime Optional. The locktime field created in the resulting outputs
   * @param toThreshold Optional. The number of signatures required to spend the funds in the resultant UTXO
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   *
   */
  buildBaseTx = async (
    networkID: number,
    blockchainID: Buffer,
    amount: BN,
    amountAssetID: Buffer,
    toAddresses: Buffer[],
    fromAddresses: Buffer[],
    changeAddresses: Buffer[] = undefined,
    fee: BN = zero,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = zero,
    lockTime: BN = zero,
    toThreshold: number = 1,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    if (toThreshold > toAddresses.length) {
      /* istanbul ignore next */
      throw new ThresholdError(
        "Error - UTXOSet.buildBaseTx: threshold is greater than number of addresses"
      )
    }

    if (typeof changeAddresses === "undefined") {
      changeAddresses = []
    }

    if (typeof feeAssetID === "undefined") {
      feeAssetID = amountAssetID
    }

    if (amount.eq(zero)) {
      return undefined
    }

    const aad: AssetAmountDestination = new AssetAmountDestination(
      toAddresses,
      toThreshold,
      fromAddresses,
      changeAddresses,
      changeThreshold
    )
    if (amountAssetID.toString("hex") === feeAssetID.toString("hex")) {
      aad.addAssetAmount(amountAssetID, amount, fee)
    } else {
      aad.addAssetAmount(amountAssetID, amount, zero)
      if (this._feeCheck(fee, feeAssetID)) {
        aad.addAssetAmount(feeAssetID, zero, fee)
      }
    }

    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    const minSpendableErr: Error = await this.spender.getMinimumSpendable(
      aad,
      asOf,
      lockTime,
      "Unlocked"
    )
    if (typeof minSpendableErr === "undefined") {
      ins = aad.getInputs()
      outs = aad.getAllOutputs()
    } else {
      throw minSpendableErr
    }

    const baseTx: BaseTx = new BaseTx(networkID, blockchainID, outs, ins, memo)
    return new UnsignedTx(baseTx)
  }

  /**
   * Creates an unsigned ImportTx transaction.
   *
   * @param networkID The number representing NetworkID of the node
   * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
   * @param toAddresses The addresses to send the funds
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs. Default: toAddresses
   * @param importIns An array of [[TransferableInput]]s being imported
   * @param sourceChain A {@link https://github.com/feross/buffer|Buffer} for the chainid where the imports are coming from.
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}. Fee will come from the inputs first, if they can.
   * @param feeAssetID Optional. The assetID of the fees being burned.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param locktime Optional. The locktime field created in the resulting outputs
   * @param toThreshold Optional. The number of signatures required to spend the funds in the received UTXO
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   *
   */
  buildImportTx = async (
    networkID: number,
    blockchainID: Buffer,
    toAddresses: Buffer[],
    fromAddresses: Buffer[],
    changeAddresses: Buffer[],
    atomics: UTXO[],
    sourceChain: Buffer = undefined,
    fee: BN = zero,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = zero,
    locktime: BN = zero,
    toThreshold: number = 1,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []
    if (typeof fee === "undefined") {
      fee = zero.clone()
    }

    const importIns: TransferableInput[] = []
    let feepaid: BN = new BN(0)
    let feeAssetStr: string = feeAssetID.toString("hex")
    for (let i: number = 0; i < atomics.length; i++) {
      const utxo: UTXO = atomics[`${i}`]
      const assetID: Buffer = utxo.getAssetID()
      const output: AmountOutput = utxo.getOutput() as AmountOutput
      let amt: BN = output.getAmount().clone()

      let infeeamount = amt.clone()
      let assetStr: string = assetID.toString("hex")
      if (
        typeof feeAssetID !== "undefined" &&
        fee.gt(zero) &&
        feepaid.lt(fee) &&
        assetStr === feeAssetStr
      ) {
        feepaid = feepaid.add(infeeamount)
        if (feepaid.gte(fee)) {
          infeeamount = feepaid.sub(fee)
          feepaid = fee.clone()
        } else {
          infeeamount = zero.clone()
        }
      }

      const txid: Buffer = utxo.getTxID()
      const outputidx: Buffer = utxo.getOutputIdx()
      const input: SECPTransferInput = new SECPTransferInput(amt)
      const xferin: TransferableInput = new TransferableInput(
        txid,
        outputidx,
        assetID,
        input
      )
      const from: Buffer[] = output.getAddresses()
      const spenders: Buffer[] = output.getSpenders(from)
      for (let j: number = 0; j < spenders.length; j++) {
        const idx: number = output.getAddressIdx(spenders[`${j}`])
        if (idx === -1) {
          /* istanbul ignore next */
          throw new AddressError(
            "Error - UTXOSet.buildImportTx: no such " +
              `address in output: ${spenders[`${j}`]}`
          )
        }
        xferin.getInput().addSignatureIdx(idx, spenders[`${j}`])
      }
      importIns.push(xferin)
      //add extra outputs for each amount (calculated from the imported inputs), minus fees
      if (infeeamount.gt(zero)) {
        const spendout: AmountOutput = SelectOutputClass(
          output.getOutputID(),
          infeeamount,
          toAddresses,
          locktime,
          toThreshold
        ) as AmountOutput
        const xferout: TransferableOutput = new TransferableOutput(
          assetID,
          spendout
        )
        outs.push(xferout)
      }
    }

    // get remaining fees from the provided addresses
    let feeRemaining: BN = fee.sub(feepaid)
    if (feeRemaining.gt(zero) && this._feeCheck(feeRemaining, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        toAddresses,
        toThreshold,
        fromAddresses,
        changeAddresses,
        changeThreshold
      )

      aad.addAssetAmount(feeAssetID, zero, feeRemaining)
      const minSpendableErr: Error = await this.spender.getMinimumSpendable(
        aad,
        asOf,
        locktime,
        "Unlocked"
      )
      if (typeof minSpendableErr === "undefined") {
        ins = aad.getInputs()
        outs = aad.getAllOutputs()
      } else {
        throw minSpendableErr
      }
    }

    const importTx: ImportTx = new ImportTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      sourceChain,
      importIns
    )
    return new UnsignedTx(importTx)
  }

  /**
   * Creates an unsigned ExportTx transaction.
   *
   * @param networkID The number representing NetworkID of the node
   * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
   * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
   * @param avaxAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AVAX
   * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who recieves the AVAX
   * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who owns the AVAX
   * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover of the AVAX
   * @param destinationChain Optional. A {@link https://github.com/feross/buffer|Buffer} for the chainid where to send the asset.
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param locktime Optional. The locktime field created in the resulting outputs
   * @param toThreshold Optional. The number of signatures required to spend the funds in the received UTXO
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   *
   */
  buildExportTx = async (
    networkID: number,
    blockchainID: Buffer,
    amount: BN,
    amountAssetID: Buffer,
    toAddresses: Buffer[],
    fromAddresses: Buffer[],
    destinationChain: Buffer,
    changeAddresses: Buffer[] = undefined,
    fee: BN = zero,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = zero,
    locktime: BN = zero,
    toThreshold: number = 1,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    if (typeof changeAddresses === "undefined") {
      changeAddresses = toAddresses
    }

    if (amount.eq(zero)) {
      return undefined
    }

    if (typeof feeAssetID === "undefined") {
      feeAssetID = amountAssetID
    } else if (feeAssetID.toString("hex") !== amountAssetID.toString("hex")) {
      /* istanbul ignore next */
      throw new FeeAssetError(
        "Error - CaminoExecutor.buildExportTx: " +
          `feeAssetID must match avaxAssetID`
      )
    }

    const aad: AssetAmountDestination = new AssetAmountDestination(
      [],
      0,
      fromAddresses,
      changeAddresses,
      changeThreshold
    )

    let singleAsset = true
    if (amountAssetID.toString("hex") === feeAssetID.toString("hex")) {
      aad.addAssetAmount(amountAssetID, zero, fee.add(amount))
    } else {
      singleAsset = false
      aad.addAssetAmount(amountAssetID, amount, zero)
      if (this._feeCheck(fee, feeAssetID)) {
        aad.addAssetAmount(feeAssetID, zero, fee)
      }
    }

    const minSpendableErr: Error = await this.spender.getMinimumSpendable(
      aad,
      asOf,
      locktime,
      "Unlocked"
    )
    if (typeof minSpendableErr === "undefined") {
      ins = aad.getInputs()
      outs = singleAsset ? aad.getAllOutputs() : aad.getChangeOutputs()
      exports = singleAsset ? [] : aad.getOutputs()
    } else {
      throw minSpendableErr
    }

    const exportTx: ExportTx = new ExportTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      destinationChain,
      exports.length > 0
        ? exports
        : [
            new SECPTransferOutput(
              amount,
              toAddresses,
              locktime,
              toThreshold
            ).makeTransferable(amountAssetID)
          ]
    )

    return new UnsignedTx(exportTx)
  }

  /**
   * Class representing an unsigned [[AddSubnetValidatorTx]] transaction.
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees in AVAX
   * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
   * @param nodeID The node ID of the validator being added.
   * @param startTime The Unix time when the validator starts validating the Primary Network.
   * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
   * @param weight The amount of weight for this subnet validator.
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param subnetAuthCredentials Optional. An array of index and address to sign for each SubnetAuth.
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   */
  buildAddSubnetValidatorTx = async (
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer,
    fromAddresses: Buffer[],
    changeAddresses: Buffer[],
    nodeID: Buffer,
    startTime: BN,
    endTime: BN,
    weight: BN,
    subnetID: string,
    fee: BN = zero,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = zero,
    subnetAuthCredentials: [number, Buffer][] = [],
    nodeCredentials: [number, Buffer] = undefined,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    const now: BN = UnixNow()
    if (startTime.lt(now) || endTime.lte(startTime)) {
      throw new Error(
        "CaminoExecutor.buildAddSubnetValidatorTx -- startTime must be in the future and endTime must come after startTime"
      )
    }

    if (this.caminoEnabled && nodeCredentials == undefined) {
      throw new Error(
        "CaminoExecutor.buildAddSubnetValidatorTx -- nodeCredentials must be provided when Camino is enabled"
      )
    }

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        [],
        0,
        fromAddresses,
        changeAddresses,
        changeThreshold
      )

      aad.addAssetAmount(feeAssetID, zero, fee)
      const minSpendableErr: Error = await this.spender.getMinimumSpendable(
        aad,
        asOf,
        zero,
        this.caminoEnabled ? "Unlocked" : "Stake"
      )
      if (typeof minSpendableErr === "undefined") {
        ins = aad.getInputs()
        outs = aad.getAllOutputs()
      } else {
        throw minSpendableErr
      }
    }

    const addSubnetValidatorTx: AddSubnetValidatorTx = new AddSubnetValidatorTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      nodeID,
      startTime,
      endTime,
      weight,
      subnetID
    )
    subnetAuthCredentials.forEach(
      (subnetAuthCredential: [number, Buffer]): void => {
        addSubnetValidatorTx.addSignatureIdx(
          subnetAuthCredential[0],
          subnetAuthCredential[1]
        )
      }
    )

    if (this.caminoEnabled) {
      addSubnetValidatorTx.setNodeSignatureIdx(
        nodeCredentials[0],
        nodeCredentials[1]
      )
    }
    return new UnsignedTx(addSubnetValidatorTx)
  }

  /**
   * Class representing an unsigned [[AddDelegatorTx]] transaction.
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param avaxAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AVAX
   * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} recieves the stake at the end of the staking period
   * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees and the stake
   * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the staking payment
   * @param nodeID The node ID of the validator being added.
   * @param startTime The Unix time when the validator starts validating the Primary Network.
   * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
   * @param stakeAmount A {@link https://github.com/indutny/bn.js/|BN} for the amount of stake to be delegated in nAVAX.
   * @param rewardLocktime The locktime field created in the resulting reward outputs
   * @param rewardThreshold The number of signatures required to spend the funds in the resultant reward UTXO
   * @param rewardAddresses The addresses the validator reward goes.
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param toThreshold Optional. The number of signatures required to spend the funds in the stake UTXO
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   */
  buildAddDelegatorTx = async (
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer,
    avaxAssetID: Buffer,
    toAddresses: Buffer[],
    fromAddresses: Buffer[],
    changeAddresses: Buffer[],
    nodeID: Buffer,
    startTime: BN,
    endTime: BN,
    stakeAmount: BN,
    rewardLocktime: BN,
    rewardThreshold: number,
    rewardAddresses: Buffer[],
    fee: BN = zero,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = zero,
    toThreshold: number = 1,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    if (this.caminoEnabled) {
      throw new ProtocolError(
        "buildAddDelegatorTx - Not supported in Camino mode"
      )
    }

    if (rewardThreshold > rewardAddresses.length) {
      /* istanbul ignore next */
      throw new ThresholdError(
        "Error - UTXOSet.buildAddDelegatorTx: reward threshold is greater than number of addresses"
      )
    }

    if (typeof changeAddresses === "undefined") {
      changeAddresses = toAddresses
    }

    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []
    let stakeOuts: TransferableOutput[] = []

    const now: BN = UnixNow()
    if (startTime.lt(now) || endTime.lte(startTime)) {
      throw new TimeError(
        "UTXOSet.buildAddDelegatorTx -- startTime must be in the future and endTime must come after startTime"
      )
    }

    const aad: AssetAmountDestination = new AssetAmountDestination(
      toAddresses,
      toThreshold,
      fromAddresses,
      changeAddresses,
      changeThreshold
    )
    if (avaxAssetID.toString("hex") === feeAssetID.toString("hex")) {
      aad.addAssetAmount(avaxAssetID, stakeAmount, fee)
    } else {
      aad.addAssetAmount(avaxAssetID, stakeAmount, zero)
      if (this._feeCheck(fee, feeAssetID)) {
        aad.addAssetAmount(feeAssetID, zero, fee)
      }
    }

    const minSpendableErr: Error = await this.spender.getMinimumSpendable(
      aad,
      asOf,
      zero,
      "Stake"
    )
    if (typeof minSpendableErr === "undefined") {
      ins = aad.getInputs()
      outs = aad.getChangeOutputs()
      stakeOuts = aad.getOutputs()
    } else {
      throw minSpendableErr
    }

    const rewardOutputOwners: SECPOwnerOutput = new SECPOwnerOutput(
      rewardAddresses,
      rewardLocktime,
      rewardThreshold
    )

    const UTx: AddDelegatorTx = new AddDelegatorTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      nodeID,
      startTime,
      endTime,
      stakeAmount,
      stakeOuts,
      new ParseableOutput(rewardOutputOwners)
    )
    return new UnsignedTx(UTx)
  }

  /**
   * Class representing an unsigned [[AddValidatorTx]] transaction.
   *
   * @param networkID NetworkID, [[DefaultNetworkID]]
   * @param blockchainID BlockchainID, default undefined
   * @param avaxAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AVAX
   * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} recieves the stake at the end of the staking period
   * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees and the stake
   * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the staking payment
   * @param nodeID The node ID of the validator being added.
   * @param startTime The Unix time when the validator starts validating the Primary Network.
   * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
   * @param stakeAmount A {@link https://github.com/indutny/bn.js/|BN} for the amount of stake to be delegated in nAVAX.
   * @param rewardLocktime The locktime field created in the resulting reward outputs
   * @param rewardThreshold The number of signatures required to spend the funds in the resultant reward UTXO
   * @param rewardAddresses The addresses the validator reward goes.
   * @param delegationFee A number for the percentage of reward to be given to the validator when someone delegates to them. Must be between 0 and 100.
   * @param minStake A {@link https://github.com/indutny/bn.js/|BN} representing the minimum stake required to validate on this network.
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param toThreshold Optional. The number of signatures required to spend the funds in the stake UTXO
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the change UTXO
   */
  buildAddValidatorTx = async (
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer,
    toAddresses: Buffer[],
    fromAddresses: Buffer[],
    changeAddresses: Buffer[],
    nodeID: Buffer,
    startTime: BN,
    endTime: BN,
    stakeAmount: BN,
    stakeAssetID: Buffer,
    rewardLocktime: BN,
    rewardThreshold: number,
    rewardAddresses: Buffer[],
    delegationFee: number,
    fee: BN = zero,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = UnixNow(),
    toThreshold: number = 1,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    if (this.caminoEnabled) {
      return this.buildCaminoAddValidatorTx(
        networkID,
        blockchainID,
        toAddresses,
        fromAddresses,
        changeAddresses,
        nodeID,
        startTime,
        endTime,
        stakeAmount,
        stakeAssetID,
        rewardAddresses,
        rewardLocktime,
        rewardThreshold,
        memo,
        asOf,
        toThreshold,
        changeThreshold
      )
    }

    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []
    let stakeOuts: TransferableOutput[] = []

    const now: BN = UnixNow()
    if (startTime.lt(now) || endTime.lte(startTime)) {
      throw new TimeError(
        "UTXOSet.buildAddValidatorTx -- startTime must be in the future and endTime must come after startTime"
      )
    }

    if (delegationFee > 100 || delegationFee < 0) {
      throw new TimeError(
        "UTXOSet.buildAddValidatorTx -- startTime must be in the range of 0 to 100, inclusively"
      )
    }

    const aad: AssetAmountDestination = new AssetAmountDestination(
      toAddresses,
      toThreshold,
      fromAddresses,
      changeAddresses,
      changeThreshold
    )
    if (stakeAssetID.toString("hex") === feeAssetID.toString("hex")) {
      aad.addAssetAmount(stakeAssetID, stakeAmount, fee)
    } else {
      aad.addAssetAmount(stakeAssetID, stakeAmount, zero)
      if (this._feeCheck(fee, feeAssetID)) {
        aad.addAssetAmount(feeAssetID, zero, fee)
      }
    }

    const minSpendableErr: Error = await this.spender.getMinimumSpendable(
      aad,
      asOf,
      zero,
      "Stake"
    )
    if (typeof minSpendableErr === "undefined") {
      ins = aad.getInputs()
      outs = aad.getChangeOutputs()
      stakeOuts = aad.getOutputs()
    } else {
      throw minSpendableErr
    }

    const rewardOutputOwners: SECPOwnerOutput = new SECPOwnerOutput(
      rewardAddresses,
      rewardLocktime,
      rewardThreshold
    )

    const UTx: AddValidatorTx = new AddValidatorTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      nodeID,
      startTime,
      endTime,
      stakeAmount,
      stakeOuts,
      new ParseableOutput(rewardOutputOwners),
      delegationFee
    )
    return new UnsignedTx(UTx)
  }

  /**
   * Class representing an unsigned [[CreateSubnetTx]] transaction.
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
   * @param subnetOwnerAddresses An array of {@link https://github.com/feross/buffer|Buffer} for the addresses to add to a subnet
   * @param subnetOwnerThreshold The number of owners's signatures required to add a validator to the network
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   */
  buildCreateSubnetTx = async (
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer,
    fromAddresses: Buffer[],
    changeAddresses: Buffer[],
    subnetOwnerAddresses: Buffer[],
    subnetOwnerThreshold: number,
    fee: BN = zero,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = zero,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        [],
        0,
        fromAddresses,
        changeAddresses,
        changeThreshold
      )

      aad.addAssetAmount(feeAssetID, zero, fee)
      const minSpendableErr: Error = await this.spender.getMinimumSpendable(
        aad,
        asOf,
        zero,
        "Unlocked"
      )
      if (typeof minSpendableErr === "undefined") {
        ins = aad.getInputs()
        outs = aad.getAllOutputs()
      } else {
        throw minSpendableErr
      }
    }

    const locktime: BN = new BN(0)
    const subnetOwners: SECPOwnerOutput = new SECPOwnerOutput(
      subnetOwnerAddresses,
      locktime,
      subnetOwnerThreshold
    )
    const createSubnetTx: CreateSubnetTx = new CreateSubnetTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      subnetOwners
    )

    return new UnsignedTx(createSubnetTx)
  }

  /**
   * Build an unsigned [[CreateChainTx]].
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
   * @param subnetID Optional ID of the Subnet that validates this blockchain
   * @param chainName Optional A human readable name for the chain; need not be unique
   * @param vmID Optional ID of the VM running on the new chain
   * @param fxIDs Optional IDs of the feature extensions running on the new chain
   * @param genesisData Optional Byte representation of genesis state of the new chain
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param subnetAuthCredentials Optional. An array of index and address to sign for each SubnetAuth.
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned CreateChainTx created from the passed in parameters.
   */
  buildCreateChainTx = async (
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer,
    fromAddresses: Buffer[],
    changeAddresses: Buffer[],
    subnetID: string | Buffer = undefined,
    chainName: string = undefined,
    vmID: string = undefined,
    fxIDs: string[] = undefined,
    genesisData: string | GenesisData = undefined,
    fee: BN = zero,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = zero,
    subnetAuthCredentials: [number, Buffer][] = [],
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        [],
        0,
        fromAddresses,
        changeAddresses,
        changeThreshold
      )

      aad.addAssetAmount(feeAssetID, zero, fee)
      const minSpendableErr: Error = await this.spender.getMinimumSpendable(
        aad,
        asOf,
        zero,
        "Unlocked"
      )
      if (typeof minSpendableErr === "undefined") {
        ins = aad.getInputs()
        outs = aad.getAllOutputs()
      } else {
        throw minSpendableErr
      }
    }

    const createChainTx: CreateChainTx = new CreateChainTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      subnetID,
      chainName,
      vmID,
      fxIDs,
      genesisData
    )
    subnetAuthCredentials.forEach(
      (subnetAuthCredential: [number, Buffer]): void => {
        createChainTx.addSignatureIdx(
          subnetAuthCredential[0],
          subnetAuthCredential[1]
        )
      }
    )

    return new UnsignedTx(createChainTx)
  }

  /**
   * Helper function which creates an unsigned [[CaminoAddValidatorTx]]. For more granular control, you may create your own
   * [[UnsignedTx]] manually and import the [[CaminoAddValidatorTx]] class directly.
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who received the staked tokens at the end of the staking period
   * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who own the staking UTXOs the fees in AVAX
   * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
   * @param nodeID The node ID of the validator being added.
   * @param startTime The Unix time when the validator starts validating the Primary Network.
   * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
   * @param stakeAmount The amount being delegated as a {@link https://github.com/indutny/bn.js/|BN}
   * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
   * @param rewardLocktime Optional. The locktime field created in the resulting reward outputs
   * @param rewardThreshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param toThreshold Optional. The number of signatures required to spend the funds in the received UTXO
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   */
  buildCaminoAddValidatorTx = async (
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer,
    to: Buffer[],
    from: Buffer[],
    change: Buffer[],
    nodeID: Buffer,
    startTime: BN,
    endTime: BN,
    stakeAmount: BN,
    stakeAssetID: Buffer,
    rewards: Buffer[],
    rewardLocktime: BN = zero,
    rewardThreshold: number = 1,
    memo: Buffer = undefined,
    asOf: BN = zero,
    toThreshold: number = 1,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    const now: BN = UnixNow()
    if (startTime.lt(now) || endTime.lte(startTime)) {
      throw new TimeError(
        "buildCaminoAddValidatorTx -- startTime must be in the future and endTime must come after startTime"
      )
    }

    const aad: AssetAmountDestination = new AssetAmountDestination(
      to,
      toThreshold,
      from,
      change,
      changeThreshold
    )

    aad.addAssetAmount(stakeAssetID, stakeAmount, new BN(0))

    const minSpendableErr: Error = await this.spender.getMinimumSpendable(
      aad,
      asOf,
      zero,
      "Bond"
    )
    if (typeof minSpendableErr === "undefined") {
      ins = aad.getInputs()
      outs = aad.getAllOutputs()
    } else {
      throw minSpendableErr
    }

    const rewardOutputOwners: SECPOwnerOutput = new SECPOwnerOutput(
      rewards,
      rewardLocktime,
      rewardThreshold
    )

    const tx: CaminoAddValidatorTx = new CaminoAddValidatorTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      nodeID,
      startTime,
      endTime,
      stakeAmount,
      new ParseableOutput(rewardOutputOwners)
    )

    return new UnsignedTx(tx)
  }

  /**
   * Build an unsigned [[AddressStateTx]].
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
   * @param address The address to alter state.
   * @param state The state to set or remove on the given address
   * @param remove Optional. Flag if state should be applied or removed
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned AddressStateTx created from the passed in parameters.
   */
  buildAddressStateTx = async (
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer,
    fromAddresses: Buffer[],
    changeAddresses: Buffer[],
    address: Buffer,
    state: number,
    remove: boolean = false,
    fee: BN = zero,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = zero,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        [],
        0,
        fromAddresses,
        changeAddresses,
        changeThreshold
      )

      aad.addAssetAmount(feeAssetID, zero, fee)

      const minSpendableErr: Error = await this.spender.getMinimumSpendable(
        aad,
        asOf,
        zero,
        "Unlocked"
      )
      if (typeof minSpendableErr === "undefined") {
        ins = aad.getInputs()
        outs = aad.getAllOutputs()
      } else {
        throw minSpendableErr
      }
    }

    const addressStateTx: AddressStateTx = new AddressStateTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      address,
      state,
      remove
    )

    return new UnsignedTx(addressStateTx)
  }

  /**
   * Build an unsigned [[RegisterNodeTx]].
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
   * @param oldNodeID Optional. ID of the existing NodeID to replace or remove.
   * @param newNodeID Optional. ID of the newNodID to register address.
   * @param address The consortiumMemberAddress, single or multi-sig.
   * @param consortiumMemberAuthCredentials An array of index and address to sign for each SubnetAuth.
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned RegisterNodeTx created from the passed in parameters.
   */
  buildRegisterNodeTx = async (
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer,
    fromAddresses: Buffer[],
    changeAddresses: Buffer[],
    oldNodeID: string | Buffer = undefined,
    newNodeID: string | Buffer = undefined,
    address: Buffer = undefined,
    consortiumMemberAuthCredentials: [number, Buffer][] = [],
    fee: BN = zero,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = zero,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        [],
        0,
        fromAddresses,
        changeAddresses,
        changeThreshold
      )

      aad.addAssetAmount(feeAssetID, zero, fee)

      const minSpendableErr: Error = await this.spender.getMinimumSpendable(
        aad,
        asOf,
        zero,
        "Unlocked"
      )
      if (typeof minSpendableErr === "undefined") {
        ins = aad.getInputs()
        outs = aad.getAllOutputs()
      } else {
        throw minSpendableErr
      }
    }

    const registerNodeTx: RegisterNodeTx = new RegisterNodeTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      oldNodeID,
      newNodeID,
      address
    )
    consortiumMemberAuthCredentials.forEach(
      (subnetAuthCredential: [number, Buffer]): void => {
        registerNodeTx.addSignatureIdx(
          subnetAuthCredential[0],
          subnetAuthCredential[1]
        )
      }
    )

    return new UnsignedTx(registerNodeTx)
  }

  /**
   * Build an unsigned [[DepositTx]].
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
   * @param depositOfferID ID of the deposit offer.
   * @param depositDuration Duration of the deposit
   * @param rewardsOwner Optional The owners of the reward. If omitted, all inputs must have the same owner
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned DepositTx created from the passed in parameters.
   */
  buildDepositTx = async (
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer,
    fromAddresses: Buffer[],
    changeAddresses: Buffer[],
    depositOfferID: string | Buffer,
    depositDuration: number | Buffer,
    rewardsOwner: OutputOwners,
    fee: BN = zero,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = zero,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        [],
        0,
        fromAddresses,
        changeAddresses,
        changeThreshold
      )

      aad.addAssetAmount(feeAssetID, zero, fee)

      const minSpendableErr: Error = await this.spender.getMinimumSpendable(
        aad,
        asOf,
        zero,
        "Unlocked"
      )
      if (typeof minSpendableErr === "undefined") {
        ins = aad.getInputs()
        outs = aad.getAllOutputs()
      } else {
        throw minSpendableErr
      }
    }

    const secpOwners = new SECPOwnerOutput(
      rewardsOwner.getAddresses(),
      rewardsOwner?.getLocktime(),
      rewardsOwner.getThreshold()
    )

    const depositTx: DepositTx = new DepositTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      depositOfferID,
      depositDuration,
      new ParseableOutput(secpOwners)
    )

    return new UnsignedTx(depositTx)
  }

  _feeCheck(fee: BN, feeAssetID: Buffer): boolean {
    return (
      typeof fee !== "undefined" &&
      typeof feeAssetID !== "undefined" &&
      fee.gt(new BN(0)) &&
      feeAssetID instanceof Buffer
    )
  }
}
