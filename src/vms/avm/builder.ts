import {
  BaseTx as AvaxBaseTx,
  TransferableInput,
  TransferableOutput,
} from '../../serializable/avax';
import type { Utxo } from '../../serializable/avax/utxo';
import { ExportTx, ImportTx } from '../../serializable/avm';
import { Id } from '../../serializable/fxs/common';
import { addressesFromBytes } from '../../utils';
import { AddressMaps } from '../../utils/addressMap';
import { getImportedInputsFromUtxos } from '../../utils/builderUtils';
import { compareTransferableOutputs } from '../../utils/sort';
import { transferableAmounts } from '../../utils/transferableAmounts';
import { defaultSpendOptions } from '../common/defaultSpendOptions';
import type { SpendOptions } from '../common/models';
import { UnsignedTx } from '../common/unsignedTx';
import type { Context } from '../context/model';
import { BaseTx } from '../../serializable/avm/baseTx';
import type { UTXOCalculationResult } from '../utils/calculateSpend';
import { calculateUTXOSpend } from '../utils/calculateSpend';
import { useAvmAndCorethUTXOs } from './utxoCalculationFns';
import { baseTxUnsafeAvm } from '../common';

/**
 *
 * @param sourceChainId id of the chain to import from
 * @param utxos list of utxos
 * @param toAddresses addresses to import the tx
 * @param fromAddressesBytes used to filter UTXOs
 * @param options used to filter UTXOs
 * @param threshold number of signers to put on the resulting utxo
 * @param locktime time the resulting utxo unlocks
 * @returns
 */
export function newImportTx(
  context: Context,
  sourceChainId: string,
  utxos: Utxo[],
  toAddresses: Uint8Array[],
  fromAddressesBytes: Uint8Array[],
  options?: SpendOptions,
  threshold = 1,
  locktime = 0n,
) {
  const fromAddresses = addressesFromBytes(fromAddressesBytes);
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
  const { importedAmounts, importedInputs, inputUTXOs } =
    getImportedInputsFromUtxos(
      utxos,
      fromAddressesBytes,
      defaultedOptions.minIssuanceTime,
    );

  if (!importedInputs.length) {
    throw new Error('no UTXOs available to import');
  }

  importedInputs.sort(TransferableInput.compare);
  const addressMaps = AddressMaps.fromTransferableInputs(
    importedInputs,
    utxos,
    defaultedOptions.minIssuanceTime,
    fromAddressesBytes,
  );
  const importedAvax = importedAmounts[context.avaxAssetID] ?? 0n;

  let inputOutputs: UTXOCalculationResult = {
    inputs: [],
    inputUTXOs: [],
    stakeOutputs: [],
    changeOutputs: [],
    addressMaps: new AddressMaps(),
  };

  const txFee = context.baseTxFee;
  const avaxAssetID = context.avaxAssetID;

  if (importedAvax > txFee) {
    importedAmounts[avaxAssetID] -= txFee;
  } else {
    if (importedAvax < txFee) {
      const toBurn = new Map<string, bigint>([
        [avaxAssetID, txFee - importedAvax],
      ]);

      inputOutputs = calculateUTXOSpend(
        toBurn,
        undefined,
        utxos,
        fromAddresses,
        defaultedOptions,
        [useAvmAndCorethUTXOs],
      );
    }
    delete importedAmounts[avaxAssetID];
  }

  inputUTXOs.push(...(inputOutputs.inputUTXOs || []));
  addressMaps.merge(inputOutputs.addressMaps || new AddressMaps());

  Object.entries(importedAmounts).forEach(([assetID, amount]) => {
    inputOutputs.changeOutputs.push(
      TransferableOutput.fromNative(
        assetID,
        amount,
        toAddresses,
        locktime,
        threshold,
      ),
    );
  });

  return new UnsignedTx(
    new ImportTx(
      AvaxBaseTx.fromNative(
        context.networkID,
        context.xBlockchainID,
        inputOutputs.changeOutputs || [],
        inputOutputs.inputs || [],
        defaultedOptions.memo,
      ),
      Id.fromString(sourceChainId),
      importedInputs,
    ),
    inputUTXOs,
    addressMaps,
  );
}

/**
 * Format export Tx given a set of utxos. The priority is determined by the order of the utxo
 * array. Fee is automatically added
 * @param destinationChain - id of the destination chain
 * @param fromAddresses - used for selecting which utxos are signable
 * @param utxoSet - list of utxos to spend from
 * @param outputs - the final desired output
 * @param options - see SpendingOptions
 */
export function newExportTx(
  context: Context,
  destinationChain: string,
  fromAddressesBytes: Uint8Array[],
  utxoSet: Utxo[],
  outputs: TransferableOutput[],
  options?: SpendOptions,
) {
  const fromAddresses = addressesFromBytes(fromAddressesBytes);
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
  const toBurn = new Map<string, bigint>([
    [context.avaxAssetID, context.baseTxFee],
  ]);

  outputs.forEach((out) => {
    const assetId = out.assetId.value();
    toBurn.set(assetId, (toBurn.get(assetId) || 0n) + out.output.amount());
  });

  const { inputs, changeOutputs, inputUTXOs, addressMaps } = calculateUTXOSpend(
    toBurn,
    undefined,
    utxoSet,
    fromAddresses,
    defaultedOptions,
    [useAvmAndCorethUTXOs],
  );
  outputs.sort(compareTransferableOutputs);
  return exportTxUnsafe(
    context,
    outputs,
    changeOutputs,
    inputs,
    destinationChain,
    defaultedOptions.memo,
    inputUTXOs,
    addressMaps,
  );
}

/**
 * Format base Tx given a set of utxos. The priority is determined by the order of the utxo
 * array. Fee is automatically added
 * @param fromAddresses - used for selecting which utxos are signable
 * @param utxoSet - list of utxos to spend from
 * @param outputs - the desired output (change outputs will be added to them automatically)
 * @param options - see SpendingOptions
 */
export function newBaseTx(
  context: Context,
  fromAddressesBytes: Uint8Array[],
  utxoSet: Utxo[],
  outputs: TransferableOutput[],
  options?: SpendOptions,
) {
  const fromAddresses = addressesFromBytes(fromAddressesBytes);
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
  const toBurn = new Map<string, bigint>([
    [context.avaxAssetID, context.baseTxFee],
  ]);

  outputs.forEach((out) => {
    const assetId = out.assetId.value();
    toBurn.set(assetId, (toBurn.get(assetId) || 0n) + out.output.amount());
  });

  const { inputs, inputUTXOs, changeOutputs, addressMaps } = calculateUTXOSpend(
    toBurn,
    undefined,
    utxoSet,
    fromAddresses,
    defaultedOptions,
    [useAvmAndCorethUTXOs],
  );

  const allOutputs = [...outputs, ...changeOutputs];
  allOutputs.sort(compareTransferableOutputs);

  return new UnsignedTx(
    new BaseTx(
      baseTxUnsafeAvm(context, allOutputs, inputs, defaultedOptions.memo),
    ),
    inputUTXOs,
    addressMaps,
  );
}

/**
 * Format export Tx based on inputs directly. extra inputs amounts are burned
 * @param outputs - the total output for the tx
 * @param changeOutputs - the output representing the remaining amounts from each input
 * @param inputs - the inputs of the tx
 * @param destinationChain - id of the destination chain
 * @param memo - optional memo
 */
const exportTxUnsafe = (
  context: Context,
  outputs: TransferableOutput[],
  changeOutputs: TransferableOutput[],
  inputs: TransferableInput[],
  destinationChain: string,
  memo: Uint8Array,
  inputUtxos: Utxo[],
  sigMappings: AddressMaps,
) => {
  outputs.sort(compareTransferableOutputs);

  const outputAmts = transferableAmounts([...outputs, ...changeOutputs]);

  const inputAmts = transferableAmounts(inputs);

  // check outputs and change outputs are all covered by inputs given
  // extra inputs are burned and is allowed
  const allOutputsCovered = Object.entries(outputAmts).every(
    ([assetID, amount]) => inputAmts[assetID] && inputAmts[assetID] >= amount,
  );

  if (!allOutputsCovered) {
    throw new Error('Not enough inputs to cover the outputs');
  }

  return new UnsignedTx(
    new ExportTx(
      baseTxUnsafeAvm(context, changeOutputs, inputs, memo),
      Id.fromString(destinationChain),
      outputs,
    ),
    inputUtxos,
    sigMappings,
  );
};
