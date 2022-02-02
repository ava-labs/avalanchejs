/**
 * @packageDocumentation
 * @module Utils-HelperFunctions
 */

import {
  NetworkIDToHRP,
  DefaultNetworkID,
  FallbackHRP,
  Defaults
} from "./constants"
import BN from "bn.js"
import { Buffer } from "buffer/"
import BinTools from "../utils/bintools"
import { PrivateKeyError, NodeIdError } from "../utils/errors"
import { ExportTx, ImportTx, TransferableInput, UnsignedTx } from "../apis/evm"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

export function getPreferredHRP(networkID: number = undefined): string {
  if (networkID in NetworkIDToHRP) {
    return NetworkIDToHRP[`${networkID}`]
  } else if (typeof networkID === "undefined") {
    return NetworkIDToHRP[`${DefaultNetworkID}`]
  }
  return FallbackHRP
}

export function MaxWeightFormula(staked: BN, cap: BN): BN {
  return BN.min(staked.mul(new BN(5)), cap)
}

/**
 * Function providing the current UNIX time using a {@link https://github.com/indutny/bn.js/|BN}.
 */
export function UnixNow(): BN {
  return new BN(Math.round(new Date().getTime() / 1000))
}

/**
 * Takes a private key buffer and produces a private key string with prefix.
 *
 * @param pk A {@link https://github.com/feross/buffer|Buffer} for the private key.
 */
export function bufferToPrivateKeyString(pk: Buffer): string {
  return `PrivateKey-${bintools.cb58Encode(pk)}`
}

/**
 * Takes a private key string and produces a private key {@link https://github.com/feross/buffer|Buffer}.
 *
 * @param pk A string for the private key.
 */
export function privateKeyStringToBuffer(pk: string): Buffer {
  if (!pk.startsWith("PrivateKey-")) {
    throw new PrivateKeyError(
      "Error - privateKeyStringToBuffer: private keys must start with 'PrivateKey-'"
    )
  }
  const pksplit: string[] = pk.split("-")
  return bintools.cb58Decode(pksplit[pksplit.length - 1])
}

/**
 * Takes a nodeID buffer and produces a nodeID string with prefix.
 *
 * @param pk A {@link https://github.com/feross/buffer|Buffer} for the nodeID.
 */
export function bufferToNodeIDString(pk: Buffer): string {
  return `NodeID-${bintools.cb58Encode(pk)}`
}

/**
 * Takes a nodeID string and produces a nodeID {@link https://github.com/feross/buffer|Buffer}.
 *
 * @param pk A string for the nodeID.
 */
export function NodeIDStringToBuffer(pk: string): Buffer {
  if (!pk.startsWith("NodeID-")) {
    throw new NodeIdError(
      "Error - privateNodeIDToBuffer: nodeID must start with 'NodeID-'"
    )
  }
  const pksplit: string[] = pk.split("-")
  return bintools.cb58Decode(pksplit[pksplit.length - 1])
}

export function costImportTx(tx: UnsignedTx): number {
  let bytesCost: number = calcBytesCost(tx.toBuffer().byteLength)
  const importTx = tx.getTransaction() as ImportTx
  importTx.getImportInputs().forEach((input: TransferableInput): void => {
    const inCost: number = input.getCost()
    bytesCost += inCost
  })
  const fixedFee: number = 10000
  return bytesCost + fixedFee
}

export function calcBytesCost(len: number): number {
  return len * Defaults.network[1].C.txBytesGas
}

export function costExportTx(tx: UnsignedTx): number {
  const bytesCost: number = calcBytesCost(tx.toBuffer().byteLength)
  const exportTx = tx.getTransaction() as ExportTx
  const numSigs: number = exportTx.getInputs().length
  const sigCost: number = numSigs * Defaults.network[1].C.costPerSignature
  const fixedFee: number = 10000
  return bytesCost + sigCost + fixedFee
}
