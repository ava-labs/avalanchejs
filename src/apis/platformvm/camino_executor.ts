/**
 * @packageDocumentation
 * @module API-PlatformVM-CaminoExecutor
 */

import BN from "bn.js"

import { Buffer } from "buffer/"
import { DefaultNetworkID } from "../../utils"
import {
  AssetAmountDestination,
  PlatformVMAPI,
  TransferableInput,
  TransferableOutput,
  UnsignedTx
} from "."
import { RegisterNodeTx } from "./registernodetx"

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
