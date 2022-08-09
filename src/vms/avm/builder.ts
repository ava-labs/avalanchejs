import {
  BaseTx,
  TransferableInput,
  TransferableOutput,
} from '../../serializable/avax';
import type { Utxo } from '../../serializable/avax/utxo';
import { ExportTx, ImportTx } from '../../serializable/avm';
import { Id } from '../../serializable/fxs/common';
import { TransferInput } from '../../serializable/fxs/secp256k1';
import { addressesFromBytes, isTransferOut } from '../../utils';
import { AddressMaps } from '../../utils/addressMap';
import { matchOwners } from '../../utils/matchOwners';
import { compareTransferableOutputs } from '../../utils/sort';
import { transferableAmounts } from '../../utils/transferableAmounts';
import { defaultSpendOptions } from '../common/defaultSpendOptions';
import type { SpendOptions } from '../common/models';
import { UnsignedTx } from '../common/unsignedTx';
import type { UtxoSpendReturn } from '../common/utxoSpend';
import { utxoSpend } from '../common/utxoSpend';
import { getContextFromURI } from '../context/context';
import type { Context } from '../context/model';

export class XBuilder {
  constructor(private readonly context: Context) {}

  static async fromURI(baseURL?: string): Promise<XBuilder> {
    return new XBuilder(await getContextFromURI(baseURL));
  }

  newImportTx(
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
    const importedInputs: TransferableInput[] = [];
    const importedAmounts: Record<string, bigint> = {};
    const inputUTXOs: Utxo[] = [];

    const addressMaps = new AddressMaps();
    utxos.forEach((utxo) => {
      const out = utxo.output;
      if (!isTransferOut(out)) return;

      const sigData = matchOwners(
        out.outputOwners,
        fromAddresses,
        defaultedOptions.minIssuanceTime,
      );

      if (!sigData) return;

      importedInputs.push(
        new TransferableInput(
          utxo.utxoId,
          utxo.assetId,
          TransferInput.fromNative(out.amount(), sigData.sigIndicies),
        ),
      );
      addressMaps.push(sigData.addressMap);
      inputUTXOs.push(utxo);
      importedAmounts[utxo.getAssetId()] =
        (importedAmounts[utxo.getAssetId()] ?? 0n) + out.amount();
    });

    if (!importedInputs.length) {
      throw new Error('no UTXOs available to import');
    }

    importedInputs.sort(TransferableInput.compare);

    const importedAvax = importedAmounts[this.context.avaxAssetID];

    let inputOutputs: UtxoSpendReturn = {
      changeOutputs: [],
      inputs: [],
      inputUtxos: [],
      addressMaps: new AddressMaps(),
    };
    const txFee = this.context.baseTxFee;
    const avaxAssetID = this.context.avaxAssetID;

    if (importedAvax > txFee) {
      importedAmounts[avaxAssetID] -= txFee;
    } else {
      if (importedAvax < txFee) {
        const toBurn = new Map<string, bigint>([
          [avaxAssetID, txFee - importedAvax],
        ]);

        inputOutputs = utxoSpend(
          toBurn,
          utxos,
          fromAddresses,
          defaultedOptions,
        );
      }
      delete importedAmounts[avaxAssetID];
    }

    inputUTXOs.push(...inputOutputs.inputUtxos);
    addressMaps.merge(inputOutputs.addressMaps);

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

    inputOutputs.changeOutputs.sort(compareTransferableOutputs);
    return new UnsignedTx(
      new ImportTx(
        BaseTx.fromNative(
          this.context.networkID,
          this.context.xBlockchainID,
          inputOutputs.changeOutputs,
          inputOutputs.inputs,
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
  newExportTx(
    destinationChain: string,
    fromAddressesBytes: Uint8Array[],
    utxoSet: Utxo[],
    outputs: TransferableOutput[],
    options?: SpendOptions,
  ) {
    const fromAddresses = addressesFromBytes(fromAddressesBytes);
    const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
    const toBurn = new Map<string, bigint>([
      [this.context.avaxAssetID, this.context.baseTxFee],
    ]);

    outputs.forEach((out) => {
      const assetId = out.assetId.value();
      toBurn.set(assetId, (toBurn.get(assetId) || 0n) + out.output.amount());
    });

    const { inputs, changeOutputs, inputUtxos, addressMaps } = utxoSpend(
      toBurn,
      utxoSet,
      fromAddresses,
      defaultedOptions,
    );
    outputs.sort(compareTransferableOutputs);
    return this.exportTxUnsafe(
      outputs,
      changeOutputs,
      inputs,
      destinationChain,
      defaultedOptions.memo,
      inputUtxos,
      addressMaps,
    );
  }

  /**
   * format a baseTx directly from inputs with no validation
   * @param changeOutputs - the output representing the remaining amounts from each input
   * @param inputs - the inputs of the tx
   * @param memo - optional memo
   */
  baseTxUnsafe = (
    changeOutputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: Uint8Array,
  ) => {
    return BaseTx.fromNative(
      this.context.networkID,
      this.context.xBlockchainID,
      changeOutputs,
      inputs,
      memo,
    );
  };

  /**
   * Format export Tx based on inputs directly. extra inputs amounts are burned
   * @param outputs - the total output for the tx
   * @param changeOutputs - the output representing the remaining amounts from each input
   * @param inputs - the inputs of the tx
   * @param destinationChain - id of the destination chain
   * @param memo - optional memo
   */
  exportTxUnsafe = (
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
        this.baseTxUnsafe(changeOutputs, inputs, memo),
        Id.fromString(destinationChain),
        outputs,
      ),
      inputUtxos,
      sigMappings,
    );
  };
}
