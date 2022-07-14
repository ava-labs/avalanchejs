import type {
  TransferableInput,
  TransferableOutput,
} from '../../serializable/avax';
import { BaseTx } from '../../serializable/avax';
import type { Utxo } from '../../serializable/avax/utxo';
import { ExportTx } from '../../serializable/avm';
import { Id } from '../../serializable/fxs/common';
import { Bytes, Int } from '../../serializable/primitives';
import { compareTransferableOutputs } from '../../utils/sort';
import { transferableAmounts } from '../../utils/transferableAmounts';
import { defaultSpendOptions } from '../common/defaultSpendOptions';
import type { SpendOptions } from '../common/models';
import { utxoSpend } from '../common/utxoSpend';
import { getContextFromURI } from '../context/context';
import type { Context } from '../context/model';

export class XBuilder {
  constructor(private readonly context: Context) {}
  static async fromURI(baseURL?: string): Promise<XBuilder> {
    return new XBuilder(await getContextFromURI('AVAX', baseURL));
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
    fromAddresses: string[],
    utxoSet: Utxo[],
    outputs: TransferableOutput[],
    options?: SpendOptions,
  ) {
    const defaultedOptions = defaultSpendOptions(fromAddresses, options);
    const toBurn = new Map<string, bigint>([
      [this.context.avaxAssetID, this.context.baseTxFee],
    ]);

    outputs.forEach((out) => {
      const assetId = out.assetId.value();
      toBurn.set(assetId, (toBurn.get(assetId) || 0n) + out.output.amount());
    });

    const { inputs, changeOutputs } = utxoSpend(
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
    return new BaseTx(
      new Int(this.context.networkID),
      new Id(this.context.xBlockchainID),
      changeOutputs,
      inputs,
      new Bytes(memo),
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

    return new ExportTx(
      this.baseTxUnsafe(changeOutputs, inputs, memo),
      new Id(destinationChain),
      outputs,
    );
  };
}
