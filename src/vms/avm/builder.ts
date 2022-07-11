import type { TransferableOutput } from '../../serializable/avax';
import { BaseTx } from '../../serializable/avax';
import type { Utxo } from '../../serializable/avax/utxo';
import { ExportTx } from '../../serializable/avm';
import { Id } from '../../serializable/fxs/common';
import { Bytes, Int } from '../../serializable/primitives';
import { compareTransferableOutputs } from '../../utils/sort';
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
    return new ExportTx(
      new BaseTx(
        new Int(this.context.networkID),
        new Id(this.context.xBlockchainID),
        changeOutputs,
        inputs,
        new Bytes(defaultedOptions.memo),
      ),
      new Id(destinationChain),
      outputs,
    );
  }
}
