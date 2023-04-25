/**
 * @packageDocumentation
 * @module API-PlatformVM-Builder
 */

import BN from "bn.js"

import { Buffer } from "buffer/"
import { OutputOwners, SigIdx, ZeroBN } from "../../common"
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
  AddressStateTx,
  AddSubnetValidatorTx,
  AddValidatorTx,
  AmountOutput,
  AssetAmountDestination,
  BaseTx,
  CaminoAddValidatorTx,
  ClaimAmount,
  ClaimAmountParams,
  ClaimTx,
  ClaimType,
  CreateChainTx,
  CreateSubnetTx,
  DepositTx,
  ExportTx,
  ImportTx,
  ParseableOutput,
  PlatformVMConstants,
  RegisterNodeTx,
  SECPOwnerOutput,
  SECPTransferInput,
  SECPTransferOutput,
  SelectOutputClass,
  TransferableInput,
  TransferableOutput,
  UnlockDepositTx,
  UnsignedTx,
  UTXO
} from "."
import { GenesisData } from "../avm"
import createHash from "create-hash"

export type LockMode = "Unlocked" | "Bond" | "Deposit" | "Stake"

export interface MinimumSpendable {
  getMinimumSpendable(
    aad: AssetAmountDestination,
    asOf: BN,
    locktime: BN,
    lockMode: LockMode
  ): Promise<Error>
}

export type FromSigner = {
  from: Buffer[]
  signer: Buffer[]
}

export type NodeOwner = {
  address: Buffer
  auth: [number, Buffer][]
}

export type Auth = {
  addresses: Buffer[]
  threshold: number
  signer: [number, Buffer][]
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
   * @param fromSigner The addresses being used to send and verify the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
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
    fromSigner: FromSigner,
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
      fromSigner.from,
      fromSigner.signer,
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
    let owners: OutputOwners[] = []

    const minSpendableErr: Error = await this.spender.getMinimumSpendable(
      aad,
      asOf,
      lockTime,
      "Unlocked"
    )
    if (typeof minSpendableErr === "undefined") {
      ins = aad.getInputs()
      outs = aad.getAllOutputs()
      owners = aad.getOutputOwners()
    } else {
      throw minSpendableErr
    }

    const baseTx: BaseTx = new BaseTx(networkID, blockchainID, outs, ins, memo)
    baseTx.setOutputOwners(owners)
    return new UnsignedTx(baseTx)
  }

  /**
   * Creates an unsigned ImportTx transaction.
   *
   * @param networkID The number representing NetworkID of the node
   * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
   * @param toAddresses The addresses to send the funds
   * @param fromSigner The addresses being used to send and verify the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
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
    fromSigner: FromSigner,
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
    let owners: OutputOwners[] = []
    const importOwners: OutputOwners[] = []

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
      importOwners.push(
        new OutputOwners(
          output.getAddresses(),
          output.getLocktime(),
          output.getThreshold()
        )
      )
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
        fromSigner.from,
        fromSigner.signer,
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
        owners = aad.getOutputOwners()
        owners.push(...importOwners)
      } else {
        throw minSpendableErr
      }
    }

    const baseTx: ImportTx = new ImportTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      sourceChain,
      importIns
    )

    baseTx.setOutputOwners(owners)
    return new UnsignedTx(baseTx)
  }

  /**
   * Creates an unsigned ExportTx transaction.
   *
   * @param networkID The number representing NetworkID of the node
   * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
   * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
   * @param avaxAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AVAX
   * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who recieves the AVAX
   * @param fromSigner The addresses being used to send and verify the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
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
    fromSigner: FromSigner,
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
    let owners: OutputOwners[] = []

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
      toAddresses,
      toThreshold,
      fromSigner.from,
      fromSigner.signer,
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
      owners = aad.getOutputOwners()
    } else {
      throw minSpendableErr
    }

    const baseTx: ExportTx = new ExportTx(
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

    baseTx.setOutputOwners(owners)
    return new UnsignedTx(baseTx)
  }

  /**
   * Class representing an unsigned [[AddSubnetValidatorTx]] transaction.
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param fromSigner The addresses being used to send and verify the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
   * @param nodeID The node ID of the validator being added.
   * @param startTime The Unix time when the validator starts validating the Primary Network.
   * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
   * @param weight The amount of weight for this subnet validator.
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param subnetAuth Optional. An Auth struct which contains the subnet Auth and the signers.
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   */
  buildAddSubnetValidatorTx = async (
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer,
    fromSigner: FromSigner,
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
    subnetAuth: Auth = { addresses: [], threshold: 0, signer: [] },
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []
    let owners: OutputOwners[] = []

    const now: BN = UnixNow()
    if (startTime.lt(now) || endTime.lte(startTime)) {
      throw new Error(
        "CaminoExecutor.buildAddSubnetValidatorTx -- startTime must be in the future and endTime must come after startTime"
      )
    }

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        [],
        0,
        fromSigner.from,
        fromSigner.signer,
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
        owners = aad.getOutputOwners()
      } else {
        throw minSpendableErr
      }
    }

    const baseTx: AddSubnetValidatorTx = new AddSubnetValidatorTx(
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
    subnetAuth.signer.forEach((subnetSigner): void => {
      baseTx.addSignatureIdx(subnetSigner[0], subnetSigner[1])
    })

    // We need to fetch the AUTH for later msig verification
    // For now we use simply what we get in subnetAuth
    owners.push(
      new OutputOwners(subnetAuth.addresses, ZeroBN, subnetAuth.threshold)
    )

    if (this.caminoEnabled) {
      baseTx.includeNodeSignature()
      owners.push(new OutputOwners([nodeID], ZeroBN, 1))
    }
    baseTx.setOutputOwners(owners)
    return new UnsignedTx(baseTx)
  }

  /**
   * Class representing an unsigned [[AddDelegatorTx]] transaction.
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param avaxAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AVAX
   * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} recieves the stake at the end of the staking period
   * @param fromSigner The addresses being used to send and verify the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
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
    fromSigner: FromSigner,
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
    let owners: OutputOwners[] = []

    const now: BN = UnixNow()
    if (startTime.lt(now) || endTime.lte(startTime)) {
      throw new TimeError(
        "UTXOSet.buildAddDelegatorTx -- startTime must be in the future and endTime must come after startTime"
      )
    }

    const aad: AssetAmountDestination = new AssetAmountDestination(
      toAddresses,
      toThreshold,
      fromSigner.from,
      fromSigner.signer,
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
      owners = aad.getOutputOwners()
    } else {
      throw minSpendableErr
    }

    const rewardOutputOwners: SECPOwnerOutput = new SECPOwnerOutput(
      rewardAddresses,
      rewardLocktime,
      rewardThreshold
    )

    const baseTx: AddDelegatorTx = new AddDelegatorTx(
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
    baseTx.setOutputOwners(owners)
    return new UnsignedTx(baseTx)
  }

  /**
   * Class representing an unsigned [[AddValidatorTx]] transaction.
   *
   * @param networkID NetworkID, [[DefaultNetworkID]]
   * @param blockchainID BlockchainID, default undefined
   * @param avaxAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AVAX
   * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} recieves the stake at the end of the staking period
   * @param fromSigner The addresses being used to send and verify the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
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
    fromSigner: FromSigner,
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
      throw new Error("Use buildCaminoAddValidatorTx")
    }

    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []
    let stakeOuts: TransferableOutput[] = []
    let owners: OutputOwners[] = []

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
      fromSigner.from,
      fromSigner.signer,
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
      owners = aad.getOutputOwners()
    } else {
      throw minSpendableErr
    }

    const rewardOutputOwners: SECPOwnerOutput = new SECPOwnerOutput(
      rewardAddresses,
      rewardLocktime,
      rewardThreshold
    )

    const baseTx: AddValidatorTx = new AddValidatorTx(
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
    baseTx.setOutputOwners(owners)
    return new UnsignedTx(baseTx)
  }

  /**
   * Class representing an unsigned [[CreateSubnetTx]] transaction.
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param fromSigner The addresses being used to send and verify the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
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
    fromSigner: FromSigner,
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
    let owners: OutputOwners[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        [],
        0,
        fromSigner.from,
        fromSigner.signer,
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
        owners = aad.getOutputOwners()
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
    const baseTx: CreateSubnetTx = new CreateSubnetTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      subnetOwners
    )
    baseTx.setOutputOwners(owners)
    return new UnsignedTx(baseTx)
  }

  /**
   * Build an unsigned [[CreateChainTx]].
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param fromSigner The addresses being used to send and verify the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
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
   * @param subnetAuth Optional. An Auth struct to sign for the Subnet.
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned CreateChainTx created from the passed in parameters.
   */
  buildCreateChainTx = async (
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer,
    fromSigner: FromSigner,
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
    subnetAuth: Auth = { addresses: [], threshold: 0, signer: [] },
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []
    let owners: OutputOwners[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        [],
        0,
        fromSigner.from,
        fromSigner.signer,
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
        owners = aad.getOutputOwners()
      } else {
        throw minSpendableErr
      }
    }

    const baseTx: CreateChainTx = new CreateChainTx(
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
    subnetAuth.signer.forEach((subnetAuthSigner): void => {
      baseTx.addSignatureIdx(subnetAuthSigner[0], subnetAuthSigner[1])
    })

    // We need to fetch the AUTH for later msig verification
    // For now we use simply what we get in subnetAuth
    owners.push(
      new OutputOwners(subnetAuth.addresses, ZeroBN, subnetAuth.threshold)
    )

    baseTx.setOutputOwners(owners)
    return new UnsignedTx(baseTx)
  }

  /**
   * Helper function which creates an unsigned [[CaminoAddValidatorTx]]. For more granular control, you may create your own
   * [[UnsignedTx]] manually and import the [[CaminoAddValidatorTx]] class directly.
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who received the staked tokens at the end of the staking period
   * @param fromSigner The addresses being used to send and verify the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
   * @param nodeID The node ID of the validator being added.
   * @param nodeOwner The address and signature indices of the registered nodeId owner.
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
    fromSigner: FromSigner,
    change: Buffer[],
    nodeID: Buffer,
    nodeOwner: NodeOwner,
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
    let owners: OutputOwners[] = []

    const now: BN = UnixNow()
    if (startTime.lt(now) || endTime.lte(startTime)) {
      throw new TimeError(
        "buildCaminoAddValidatorTx -- startTime must be in the future and endTime must come after startTime"
      )
    }

    const aad: AssetAmountDestination = new AssetAmountDestination(
      to,
      toThreshold,
      fromSigner.from,
      fromSigner.signer,
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
      owners = aad.getOutputOwners()
    } else {
      throw minSpendableErr
    }

    const rewardOutputOwners: SECPOwnerOutput = new SECPOwnerOutput(
      rewards,
      rewardLocktime,
      rewardThreshold
    )

    const baseTx: CaminoAddValidatorTx = new CaminoAddValidatorTx(
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

    nodeOwner.auth.forEach((o) => {
      baseTx.addSignatureIdx(o[0], o[1])
    })
    owners.push(new OutputOwners([nodeOwner.address], ZeroBN, 1))

    baseTx.setOutputOwners(owners)
    return new UnsignedTx(baseTx)
  }

  /**
   * Build an unsigned [[AddressStateTx]].
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param fromSigner The addresses being used to send and verify the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
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
    fromSigner: FromSigner,
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
    let owners: OutputOwners[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        [],
        0,
        fromSigner.from,
        fromSigner.signer,
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

    const baseTx: AddressStateTx = new AddressStateTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      address,
      state,
      remove
    )

    baseTx.setOutputOwners(owners)
    return new UnsignedTx(baseTx)
  }

  /**
   * Build an unsigned [[RegisterNodeTx]].
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param fromSigner The addresses being used to send and verify the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
   * @param oldNodeID Optional. ID of the existing NodeID to replace or remove.
   * @param newNodeID Optional. ID of the newNodID to register address.
   * @param address The consortiumMemberAddress, single or multi-sig.
   * @param addressAuths An array of index and address to verify ownership of address.
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
    fromSigner: FromSigner,
    changeAddresses: Buffer[],
    oldNodeID: Buffer = undefined,
    newNodeID: Buffer = undefined,
    address: Buffer = undefined,
    addressAuths: [number, Buffer][] = [],
    fee: BN = zero,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = zero,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []
    let owners: OutputOwners[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        [],
        0,
        fromSigner.from,
        fromSigner.signer,
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
        owners = aad.getOutputOwners()
      } else {
        throw minSpendableErr
      }
    }

    const baseTx: RegisterNodeTx = new RegisterNodeTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      oldNodeID,
      newNodeID,
      address
    )

    addressAuths.forEach((addressAuth) => {
      baseTx.addSignatureIdx(addressAuth[0], addressAuth[1])
    })

    owners.push(
      newNodeID && !oldNodeID
        ? new OutputOwners([newNodeID], ZeroBN, 1)
        : new OutputOwners()
    )
    owners.push(new OutputOwners([address], ZeroBN, 1))

    baseTx.setOutputOwners(owners)
    return new UnsignedTx(baseTx)
  }

  /**
   * Build an unsigned [[DepositTx]].
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param fromSigner The addresses being used to send and verify the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
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
    fromSigner: FromSigner,
    changeAddresses: Buffer[],
    depositOfferID: string | Buffer,
    depositDuration: number | Buffer,
    rewardsOwner: OutputOwners,
    fee: BN = zero,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = zero,
    amountToLock: BN,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []
    let owners: OutputOwners[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        [],
        0,
        fromSigner.from,
        fromSigner.signer,
        changeAddresses,
        changeThreshold
      )

      aad.addAssetAmount(feeAssetID, amountToLock, fee)

      const minSpendableErr: Error = await this.spender.getMinimumSpendable(
        aad,
        asOf,
        zero,
        "Deposit"
      )
      if (typeof minSpendableErr === "undefined") {
        ins = aad.getInputs()
        outs = aad.getAllOutputs()
        owners = aad.getOutputOwners()
      } else {
        throw minSpendableErr
      }
    }

    const secpOwners = new SECPOwnerOutput(
      rewardsOwner.getAddresses(),
      rewardsOwner?.getLocktime(),
      rewardsOwner.getThreshold()
    )

    const baseTx: DepositTx = new DepositTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      depositOfferID,
      depositDuration,
      new ParseableOutput(secpOwners)
    )

    baseTx.setOutputOwners(owners)
    return new UnsignedTx(baseTx)
  }

  /**
   * Build an unsigned [[UnlockDepositTx]].
   *
   * @param networkID Networkid, [[DefaultNetworkID]]
   * @param blockchainID Blockchainid, default undefined
   * @param fromSigner @param fromSigner The addresses being used to send and verify the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned UnlockDepositTx created from the passed in parameters.
   */
  buildUnlockDepositTx = async (
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer,
    fromSigner: FromSigner,
    changeAddresses: Buffer[],
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
        fromSigner.from,
        fromSigner.signer,
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

    const unlockDepositTx: UnlockDepositTx = new UnlockDepositTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo
    )

    return new UnsignedTx(unlockDepositTx)
  }

  /**
   * Build an unsigned [[ClaimTx]].
   *
   * @param networkID NetworkID, [[DefaultNetworkID]]
   * @param blockchainID BlockchainID, default undefined
   * @param fromSigner @param fromSigner The addresses being used to send and verify the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
   * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
   * @param feeAssetID Optional. The assetID of the fees being burned
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   * @param claimAmounts The specification and authentication what and how much to claim
   * @param claimTo The address to claimed rewards will be directed to
   *
   * @returns An unsigned ClaimTx created from the passed in parameters.
   */
  buildClaimTx = async (
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer,
    fromSigner: FromSigner,
    changeAddresses: Buffer[],
    fee: BN = zero,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined,
    asOf: BN = zero,
    changeThreshold: number = 1,
    claimAmounts: ClaimAmountParams[],
    claimTo: OutputOwners = undefined
  ): Promise<UnsignedTx> => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []
    let owners: OutputOwners[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        [],
        0,
        fromSigner.from,
        fromSigner.signer,
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
        owners = aad.getOutputOwners()
      } else {
        throw minSpendableErr
      }
    }

    // TODO: Compact if possible
    const txClaimAmounts: ClaimAmount[] = []
    const allSigIdxs: SigIdx[][] = []
    for (const amt of claimAmounts) {
      const receiver = claimTo ? claimTo : amt.owners
      outs.push(
        new TransferableOutput(
          feeAssetID,
          new SECPTransferOutput(
            amt.amount,
            receiver.getAddresses(),
            receiver.getLocktime(),
            receiver.getThreshold()
          )
        )
      )
      let id = amt.id
      if (!id) {
        if (amt.claimType === ClaimType.ACTIVE_DEPOSIT_REWARD)
          throw new Error("ClaimAmount id must be set")
        const b = Buffer.alloc(2, PlatformVMConstants.LATESTCODEC)
        id = Buffer.from(
          createHash("sha256")
            .update(Buffer.concat([b, amt.owners.toBuffer()]))
            .digest()
        )
      }

      // Create SigIdxs
      if (amt.sigIdxs.length !== amt.owners.getThreshold())
        throw new Error("SigIdx count mismatch")
      const sigIdxs: SigIdx[] = []
      const addrs = amt.owners.getAddresses()
      for (const idx of amt.sigIdxs) {
        if (idx >= addrs.length) throw new Error("SigIdx out of bound")
        sigIdxs.push(new SigIdx(idx, addrs[idx]))
      }

      // Create auth for verification of claimAmount owner
      const bufferSigIdxs = sigIdxs.map((s) => s.getBytes())

      txClaimAmounts.push(
        new ClaimAmount(id, amt.claimType, amt.amount, bufferSigIdxs)
      )
      allSigIdxs.push(sigIdxs)
      owners.push(amt.owners)
    }

    const claimTx: ClaimTx = new ClaimTx(
      networkID,
      blockchainID,
      outs,
      ins,
      memo,
      txClaimAmounts
    )

    // Build signatureIndices
    for (const s of allSigIdxs) claimTx.addSigIdxs(s)

    claimTx.setOutputOwners(owners)
    return new UnsignedTx(claimTx)
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
