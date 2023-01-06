/**
 * @packageDocumentation
 * @module API-PlatformVM-CaminoExecutor
 */

import BN from "bn.js"

import { Buffer } from "buffer/"
import { DefaultNetworkID, UnixNow } from "../../utils"
import { TimeError } from "../../utils/errors"
import {
  AssetAmountDestination,
  CaminoAddValidatorTx,
  ParseableOutput,
  PlatformVMAPI,
  RegisterNodeTx,
  SECPOwnerOutput,
  TransferableInput,
  TransferableOutput,
  UnsignedTx
} from "."

type CaminoLockMode = "Unlocked" | "Bond" | "Deposit"

export class CaminoExecutor {
  platformAPI: PlatformVMAPI

  constructor(platformAPI: PlatformVMAPI) {
    this.platformAPI = platformAPI
  }

  spend = async (
    aad: AssetAmountDestination,
    lockMode: CaminoLockMode,
    feeAssetID: Buffer = undefined
  ): Promise<Error> => {
    const addr = aad
      .getSenders()
      .map((a) => this.platformAPI.addressFromBuffer(a))
    const changeAddr =
      aad.getChangeAddresses().length > 0
        ? this.platformAPI.addressFromBuffer(aad.getChangeAddresses()[0])
        : ""

    const aa = aad.getAssetAmount(feeAssetID.toString("hex"))

    const result = await this.platformAPI.spend(
      addr,
      changeAddr,
      lockMode,
      aa.getAmount(),
      aa.getBurn()
    )

    result.ins.forEach((inp) => {
      aad.addInput(inp)
    })
    result.out.forEach((out) => {
      aad.addOutput(out)
    })

    return
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
    rewards: Buffer[],
    rewardLocktime: BN = new BN(0),
    rewardThreshold: number = 1,
    memo: Buffer = undefined,
    avaxAssetID: Buffer
  ): Promise<UnsignedTx> => {
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    const zero: BN = new BN(0)
    const now: BN = UnixNow()
    if (startTime.lt(now) || endTime.lte(startTime)) {
      throw new TimeError(
        "buildCaminoAddValidatorTx -- startTime must be in the future and endTime must come after startTime"
      )
    }

    const aad: AssetAmountDestination = new AssetAmountDestination(
      to,
      from,
      change
    )

    aad.addAssetAmount(avaxAssetID, stakeAmount, new BN(0))

    const minSpendableErr: Error = await this.spend(aad, "Bond", avaxAssetID)
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
    fee: BN = undefined,
    feeAssetID: Buffer = undefined,
    memo: Buffer = undefined
  ): Promise<UnsignedTx> => {
    const zero: BN = new BN(0)
    let ins: TransferableInput[] = []
    let outs: TransferableOutput[] = []

    if (this._feeCheck(fee, feeAssetID)) {
      const aad: AssetAmountDestination = new AssetAmountDestination(
        fromAddresses,
        fromAddresses,
        changeAddresses
      )

      aad.addAssetAmount(feeAssetID, zero, fee)

      const minSpendableErr: Error = await this.spend(
        aad,
        "Unlocked",
        feeAssetID
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

  _feeCheck(fee: BN, feeAssetID: Buffer): boolean {
    return (
      typeof fee !== "undefined" &&
      typeof feeAssetID !== "undefined" &&
      fee.gt(new BN(0)) &&
      feeAssetID instanceof Buffer
    )
  }
}
