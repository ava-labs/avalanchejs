import { TransferableInput } from '../serializable/avax';
import type { Utxo } from '../serializable/avax/utxo';
import { addressesFromBytes } from './address';
import { AddressMaps } from './addressMap';
import { matchOwners } from './matchOwners';
import { isTransferOut } from './typeGuards';

type GetImportedInputsFromUtxosOutput = {
  importedInputs: TransferableInput[];
  addressMaps: AddressMaps;
  inputUTXOs: Utxo[];
  importedAmounts: Record<string, bigint>;
};

export const getImportedInputsFromUtxos = (
  utxos: Utxo[],
  fromAddressesBytes: Uint8Array[],
  minIssuanceTime: bigint,
): GetImportedInputsFromUtxosOutput => {
  const fromAddresses = addressesFromBytes(fromAddressesBytes);
  const outputs: GetImportedInputsFromUtxosOutput = {
    importedInputs: [],
    addressMaps: new AddressMaps(),
    inputUTXOs: [],
    importedAmounts: {},
  };

  return utxos.reduce((agg, utxo): GetImportedInputsFromUtxosOutput => {
    const { addressMaps, importedInputs, inputUTXOs, importedAmounts } = agg;
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
    addressMaps.push(sigData.addressMap);
    inputUTXOs.push(utxo);
    importedAmounts[utxo.getAssetId()] =
      (importedAmounts[utxo.getAssetId()] ?? 0n) + out.amount();
    return agg;
  }, outputs);
};
