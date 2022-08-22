import { TransferableInput, TransferableOutput } from '../../serializable/avax';
import type { Utxo } from '../../serializable/avax/utxo';
import type { Address } from '../../serializable/fxs/common';
import { OutputOwners, TransferOutput } from '../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../serializable/primitives';
import { addressesFromBytes, isTransferOut } from '../../utils';
import { AddressMaps } from '../../utils/addressMap';
import { bigIntMin } from '../../utils/bigintMath';
import { matchOwners } from '../../utils/matchOwners';
import { compareTransferableOutputs } from '../../utils/sort';
import type { SpendOptionsRequired } from '../common/models';

export interface UtxoSpendReturn {
  changeOutputs: TransferableOutput[];
  inputs: TransferableInput[];
  inputUtxos: Utxo[];
  addressMaps: AddressMaps;
}

export const iterateUtxoforSpend = (
  utxos: Utxo[],
  fromAddresses: Address[],
  options: SpendOptionsRequired,
  utxoPredicate?: (utxo: Utxo) => boolean,
  postAction?: (utxo: Utxo) => void,
) => {
  const inputs: TransferableInput[] = [];
  const inputUtxos: Utxo[] = [];
  const addressMaps = new AddressMaps();

  utxos.forEach((utxo) => {
    if (utxoPredicate && !utxoPredicate(utxo)) {
      return;
    }
    const utxoTransferout = utxo.output;
    if (!isTransferOut(utxoTransferout)) {
      // We only support burning [secp256k1fx.TransferOutput]s.
      return;
    }

    const sigData = matchOwners(
      utxoTransferout.outputOwners,
      fromAddresses,
      options.minIssuanceTime,
    );
    if (!sigData) {
      return;
    }

    inputs.push(
      TransferableInput.fromUtxoAndSigindicies(utxo, sigData.sigIndicies),
    );

    inputUtxos.push(utxo);
    addressMaps.push(sigData.addressMap);

    if (postAction) {
      postAction(utxo);
    }
  });

  inputs.sort(TransferableInput.compare);

  return { inputs, inputUtxos, addressMaps };
};

// UTXO Spend for coreth/AVM UTXOs
export const utxoSpend = (
  amountsToBurn: Map<string, bigint>,
  utxos: Utxo[],
  fromAddresses: Address[],
  options: SpendOptionsRequired,
): UtxoSpendReturn => {
  const changeOutputs: TransferableOutput[] = [];
  const changeOwner = new OutputOwners(
    new BigIntPr(0n),
    new Int(1),
    addressesFromBytes(options.changeAddresses),
  );

  const { addressMaps, inputUtxos, inputs } = iterateUtxoforSpend(
    utxos,
    fromAddresses,
    options,
    (utxo) => {
      return !!amountsToBurn.get(utxo.assetId.toString());
    },
    (utxo) => {
      const utxoTransferout = utxo.output as TransferOutput;

      const remainingAmountToBurn =
        amountsToBurn.get(utxo.assetId.toString()) ?? 0n;
      const amountToBurn = bigIntMin(
        remainingAmountToBurn,
        utxoTransferout.amt.value(),
      );

      amountsToBurn.set(
        utxo.assetId.toString(),
        remainingAmountToBurn - amountToBurn,
      );
      const remainingAmount = utxoTransferout.amt.value() - amountToBurn;
      if (remainingAmount > 0) {
        changeOutputs.push(
          new TransferableOutput(
            utxo.assetId,
            new TransferOutput(new BigIntPr(remainingAmount), changeOwner),
          ),
        );
      }
    },
  );

  inputs.sort(TransferableInput.compare);
  changeOutputs.sort(compareTransferableOutputs);

  return { inputs, changeOutputs, inputUtxos, addressMaps };
};
