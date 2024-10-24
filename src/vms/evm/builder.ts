import { TransferableInput, TransferableOutput } from '../../serializable/avax';
import type { Utxo } from '../../serializable/avax/utxo';
import { ExportTx, ImportTx, Input, Output } from '../../serializable/evm';
import { Address, Id } from '../../serializable/fxs/common';
import {
  OutputOwners,
  TransferInput,
  TransferOutput,
} from '../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../serializable/primitives';
import { addressesFromBytes } from '../../utils';
import { AddressMap, AddressMaps, matchOwners } from '../../utils/addressMap';
import { costCorethTx } from '../../utils/costs';
import { compareEVMOutputs } from '../../utils/sort';
import { EVMUnsignedTx } from '../common/evmUnsignedTx';
import type { UnsignedTx } from '../common/unsignedTx';
import type { Context } from '../context';

export type EVMExportOptions = {
  locktime: bigint;
  threshold: number;
};

const defaultEVMExportOptions = (
  options?: Partial<EVMExportOptions>,
): EVMExportOptions => {
  return {
    locktime: 0n,
    threshold: 1,
    ...options,
  };
};

/**
 * similar to new exportTX, except it estimates the price from base fee automatically
 * @param baseFee dynamic fee fetched from evmapi
 * @param amount amount to export
 * @param destinationChain chainID of the destination chain
 * @param fromAddress address that can sign this tx
 * @param toAddresses address on the destination chain
 * @param nonce the number of tx's on the sender's evm address. need to get from EVM directly using a lib like ethers.
 * @param assetId the assetId to export
 * @param options for additional properties of the resulting utxo
 * @returns EVMUnsignedTx
 */
export function newExportTxFromBaseFee(
  context: Context,
  baseFee: bigint,
  amount: bigint,
  destinationChain: string,
  fromAddress: Uint8Array,
  toAddresses: Uint8Array[],
  nonce: bigint,
  assetId?: string,
  options?: Partial<EVMExportOptions>,
) {
  const fee = estimateExportCost(
    context,
    baseFee,
    amount,
    destinationChain,
    fromAddress,
    toAddresses,
    nonce,
    assetId,
    options,
  );

  return newExportTx(
    context,
    amount,
    destinationChain,
    fromAddress,
    toAddresses,
    fee,
    nonce,
    assetId,
    options,
  );
}

/**
 *
 * estimate the export cost by forming a dummy tx and returning the fee based on the length of the tx
 * @param baseFee dynamic fee fetched from EVMAPI
 * @param amount amount to export in nAVAX
 * @param destinationChain chainID of the destination chain
 * @param fromAddress address that can sign this tx
 * @param toAddresses address on the destination chain
 * @param nonce the number of tx's on the sender's evm address. need to get from EVM directly using a lib like ethers.
 * @param assetId the assetId to export
 * @param options for additional properties of the resulting utxo
 * @returns BigInt
 */

export function estimateExportCost(
  context: Context,
  baseFee: bigint,
  amount: bigint,
  destinationChain: string,
  fromAddress: Uint8Array,
  toAddresses: Uint8Array[],
  nonce: bigint,
  assetId?: string,
  options?: Partial<EVMExportOptions>,
) {
  const dummyTx = newExportTx(
    context,
    amount,
    destinationChain,
    fromAddress,
    toAddresses,
    baseFee,
    nonce,
    assetId,
    options,
  );

  const importCost = costCorethTx(dummyTx);
  return baseFee * importCost;
}

/**
 * returns an export tx
 * @param amount amount to export
 * @param destinationChain chainID of the destination chain
 * @param fromAddress address that can sign this tx
 * @param toAddresses address on the destination chain
 * @param fee dynamic fee fetched from evmapi
 * @param nonce the number of tx's on the sender's evm address. need to get from EVM directly using a lib like ethers.
 * @param assetId the assetId to export
 * @param options for additional properties of the resulting utxo
 * @returns EVMUnsignedTx
 */

export function newExportTx(
  context: Context,
  amount: bigint,
  destinationChain: string,
  fromAddress: Uint8Array,
  toAddresses: Uint8Array[],
  fee: bigint,
  nonce: bigint,
  assetId?: string,
  options?: Partial<EVMExportOptions>,
) {
  assetId = assetId ?? context.avaxAssetID;
  const { threshold, locktime } = defaultEVMExportOptions(options);
  const avaxAssetID = context.avaxAssetID;
  const evmInputConfigs: {
    amount: bigint;
    assetId: string;
  }[] = [];

  const assetIsAvax = avaxAssetID === assetId;

  if (assetIsAvax) {
    evmInputConfigs.push({
      assetId: context.avaxAssetID,
      amount: amount + fee,
    });
  } else {
    // if asset id isn't AVAX asset id then create 2 inputs
    // first input will be AVAX and will be for the amount of the fee
    // second input will be the ANT
    evmInputConfigs.push({
      amount: fee,
      assetId: context.avaxAssetID,
    });
    evmInputConfigs.push({
      amount,
      assetId,
    });
  }

  const evmInputs = evmInputConfigs.map(
    ({ assetId, amount }) =>
      new Input(
        new Address(fromAddress),
        new BigIntPr(amount),
        Id.fromString(assetId),
        new BigIntPr(nonce),
      ),
  );

  const transferableOutputs = [
    new TransferableOutput(
      Id.fromString(assetId),
      new TransferOutput(
        new BigIntPr(amount),
        new OutputOwners(
          new BigIntPr(locktime),
          new Int(threshold),
          addressesFromBytes(toAddresses),
        ),
      ),
    ),
  ];
  evmInputs.sort(Input.compare);
  return new EVMUnsignedTx(
    new ExportTx(
      new Int(context.networkID),
      Id.fromString(context.cBlockchainID),
      Id.fromString(destinationChain),
      evmInputs,
      transferableOutputs,
    ),
    [],
    new AddressMaps([new AddressMap([[new Address(fromAddress), 0]])]),
  );
}

/**
  this method will handle making a dummy tx to calculate fees, and then using that to return the
  correct tx
  * @param toAddresses address on C-chain
  * @param fromAddress address that can sign this tx
  * @param sourceChain chainID of the source chain
   * @param baseFee dynamic fee fetched from evmapi
   * @param feeAssetId the assetId that the fee is measured in. defaults to AVAX
   * @returns UnsignedTx


  basefee is in nAvax
   */
export function newImportTxFromBaseFee(
  context: Context,
  toAddress: Uint8Array,
  fromAddressesBytes: Uint8Array[],
  atomics: Utxo[],
  sourceChain: string,
  baseFee = 0n,
  feeAssetId?: string,
) {
  const fee = estimateImportCost(
    context,
    toAddress,
    fromAddressesBytes,
    atomics,
    sourceChain,
    baseFee,
    feeAssetId,
  );

  return newImportTx(
    context,
    toAddress,
    fromAddressesBytes,
    atomics,
    sourceChain,
    fee,
    feeAssetId,
  );
}

/**
 * calculates the fee by forming a dummy tx and calculating based on the length of the tx
 * @param toAddress address to import the utxos
 * @param fromAddressesBytes addresses that are able to sign utxos
 * @param atomics list of available utxos
 * @param sourceChain base58 id of the chain to import from
 * @param baseFee baseFee from EVMAPI.getBaseFee
 * @param feeAssetId base58 ID of the asset to use for fee
 * @returns BigInt
 */

function estimateImportCost(
  context: Context,
  toAddress: Uint8Array,
  fromAddressesBytes: Uint8Array[],
  atomics: Utxo[],
  sourceChain: string,
  baseFee = 0n,
  feeAssetId?: string,
) {
  const dummyImportTx = newImportTx(
    context,
    toAddress,
    fromAddressesBytes,
    atomics,
    sourceChain,
    baseFee,
    feeAssetId,
  );

  const importCost = costCorethTx(dummyImportTx);
  return baseFee * importCost;
}

/**
 *
 * @param toAddress address to import the utxos
 * @param fromAddressesBytes addresses that are able to sign utxos
 * @param atomics list of available utxos
 * @param sourceChain base58 id of the chain to import from
 * @param fee fee to subtract. If unsure, use newImportTxFromBaseFee
 * @param feeAssetId base58 ID of the asset to use for fee
 * @returns UnsignedTx
 */
export function newImportTx(
  context: Context,
  toAddress: Uint8Array,
  fromAddressesBytes: Uint8Array[],
  atomics: Utxo[],
  sourceChain: string,
  fee = 0n,
  feeAssetId = context.avaxAssetID,
): UnsignedTx {
  const fromAddresses = addressesFromBytes(fromAddressesBytes);

  const map: Map<string, bigint> = new Map();
  let ins: TransferableInput[] = [];
  let outs: Output[] = [];
  let feepaid = 0n;
  const inputUtxos: Utxo[] = [];

  // build a set of inputs which covers the fee
  atomics.forEach((atomic) => {
    const assetID: string = atomic.getAssetId();
    const output = atomic.output as TransferOutput;
    const amount = output.amount();
    let infeeamount = amount;
    if (feeAssetId && fee && feepaid < fee && feeAssetId === assetID) {
      feepaid += infeeamount;
      if (feepaid > fee) {
        infeeamount = feepaid - fee;
        feepaid = fee;
      } else {
        infeeamount = 0n;
      }
    }

    const sigData = matchOwners(output.outputOwners, fromAddresses, 0n);

    if (!sigData) return;

    const xferin: TransferableInput = new TransferableInput(
      atomic.utxoId,
      atomic.assetId,
      TransferInput.fromNative(amount, sigData.sigIndicies),
    );
    ins.push(xferin);
    inputUtxos.push(atomic);
    const assetFeeAmount = map.get(assetID);
    if (assetFeeAmount) {
      infeeamount += assetFeeAmount;
    }
    map.set(assetID, infeeamount);
  });

  for (const [assetID, amount] of map.entries()) {
    // Create single EVMOutput for each assetID
    outs.push(
      new Output(
        new Address(toAddress),
        new BigIntPr(amount),
        Id.fromString(assetID),
      ),
    );
  }

  // lexicographically sort array
  ins = ins.sort(TransferableInput.compare);
  const addressMaps = AddressMaps.fromTransferableInputs(
    ins,
    atomics,
    0n,
    fromAddressesBytes,
  );
  outs = outs.sort(compareEVMOutputs);

  const importTx = new ImportTx(
    new Int(context.networkID),
    Id.fromString(context.cBlockchainID),
    Id.fromString(sourceChain),
    ins,
    outs,
  );
  return new EVMUnsignedTx(importTx, inputUtxos, addressMaps);
}
