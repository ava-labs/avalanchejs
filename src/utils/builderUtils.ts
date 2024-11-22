import { TransferableInput } from '../serializable/avax';
import type { Utxo } from '../serializable/avax/utxo';
import { matchOwners } from './addressMap';
import { addressesFromBytes } from './addressesFromBytes';
import { isTransferOut } from './typeGuards';

type GetImportedInputsFromUtxosOutput = {
  importedInputs: TransferableInput[];
  inputUTXOs: Utxo[];
  importedAmounts: Record<string, bigint>;
};

export const getImportedInputsFromUtxos = (
  utxos: readonly Utxo[],
  fromAddressesBytes: readonly Uint8Array[],
  minIssuanceTime: bigint,
): GetImportedInputsFromUtxosOutput => {
  const fromAddresses = addressesFromBytes(fromAddressesBytes);
  const outputs: GetImportedInputsFromUtxosOutput = {
    importedInputs: [],
    inputUTXOs: [],
    importedAmounts: {},
  };

  return utxos.reduce((agg, utxo): GetImportedInputsFromUtxosOutput => {
    const { importedInputs, inputUTXOs, importedAmounts } = agg;
    const out = utxo.output;
    if (!isTransferOut(out)) return agg;

    const sigData = matchOwners(
      out.outputOwners,
      fromAddresses,
      minIssuanceTime,
    );

    if (!sigData) return agg;

    importedInputs.push(
      TransferableInput.fromUtxoAndSigindicies(utxo, sigData.sigIndicies),
    );
    inputUTXOs.push(utxo);
    importedAmounts[utxo.getAssetId()] =
      (importedAmounts[utxo.getAssetId()] ?? 0n) + out.amount();
    return agg;
  }, outputs);
};
