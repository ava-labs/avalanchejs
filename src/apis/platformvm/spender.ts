/**
 * @packageDocumentation
 * @module API-PlatformVM-Spender
 */

import BN from "bn.js"

import { AssetAmountDestination, PlatformVMAPI } from "."
import { FeeAssetError } from "../../utils/errors"

import { LockMode } from "./builder"

export class Spender {
  platformAPI: PlatformVMAPI

  constructor(platformAPI: PlatformVMAPI) {
    this.platformAPI = platformAPI
  }

  getMinimumSpendable = async (
    aad: AssetAmountDestination,
    asOf: BN,
    lockTime: BN,
    lockMode: LockMode
  ): Promise<Error> => {
    if (aad.getAmounts().length !== 1) {
      return new FeeAssetError("spender -- multiple assets not yet supported")
    }

    const addr = aad
      .getSenders()
      .map((a) => this.platformAPI.addressFromBuffer(a))

    const signer = aad
      .getSigners()
      .map((a) => this.platformAPI.addressFromBuffer(a))

    const to = aad
      .getDestinations()
      .map((a) => this.platformAPI.addressFromBuffer(a))

    const change = aad
      .getChangeAddresses()
      .map((a) => this.platformAPI.addressFromBuffer(a))

    const aa = aad.getAmounts()[0]

    const result = await this.platformAPI.spend(
      addr,
      signer,
      to,
      aad.getDestinationsThreshold(),
      lockTime,
      change,
      aad.getChangeAddressesThreshold(),
      lockMode,
      aa.getAmount(),
      aa.getBurn(),
      asOf
    )

    result.ins.forEach((inp) => {
      aad.addInput(inp)
    })
    result.out.forEach((out) => {
      aad.addOutput(out)
    })
    aad.setOutputOwners(result.owners)
    return
  }
}
