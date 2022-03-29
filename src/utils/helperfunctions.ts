/**
 * @packageDocumentation
 * @module Utils-HelperFunctions
 */

import BN from "bn.js"
import { Buffer } from "buffer/"
import { C } from "./networks"
import BinTools from "../utils/bintools"
import { PrivateKeyError, NodeIdError } from "../utils/errors"
import { ExportTx, ImportTx, TransferableInput, UnsignedTx } from "src/apis/evm"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

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
  return "PrivateKey-" + bintools.cb58Encode(pk)
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
  let pksplit: string[] = pk.split("-")
  return bintools.cb58Decode(pksplit[pksplit.length - 1])
}

/**
 * Takes a nodeID buffer and produces a nodeID string with prefix.
 *
 * @param pk A {@link https://github.com/feross/buffer|Buffer} for the nodeID.
 */
export function bufferToNodeIDString(pk: Buffer): string {
  return "NodeID-" + bintools.cb58Encode(pk)
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
  let pksplit: string[] = pk.split("-")
  return bintools.cb58Decode(pksplit[pksplit.length - 1])
}

export function costImportTx(c: C, tx: UnsignedTx): number {
  let bytesCost: number = calcBytesCost(c, tx.toBuffer().byteLength)
  const importTx = tx.getTransaction() as ImportTx
  importTx.getImportInputs().forEach((input: TransferableInput): void => {
    const inCost: number = input.getCost(c)
    bytesCost += inCost
  })
  const fixedFee: number = 10000
  return bytesCost + fixedFee
}

export function calcBytesCost(c: C, len: number): number {
  return len * c.txBytesGas
}

export function costExportTx(c: C, tx: UnsignedTx): number {
  const bytesCost: number = calcBytesCost(c, tx.toBuffer().byteLength)
  const exportTx = tx.getTransaction() as ExportTx
  const numSigs: number = exportTx.getInputs().length
  const sigCost: number = numSigs * c.costPerSignature
  const fixedFee: number = 10000
  return bytesCost + sigCost + fixedFee
}
