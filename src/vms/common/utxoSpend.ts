import { TransferableInput, TransferableOutput } from '../../serializable/avax';
import type { Utxo } from '../../serializable/avax/utxo';
import type { Address } from '../../serializable/fxs/common';
import {
  OutputOwners,
  TransferInput,
  TransferOutput,
} from '../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../serializable/primitives';
import { addressesFromBytes, isTransferOut } from '../../utils';
import { AddressMaps } from '../../utils/addressMap';
import { bigIntMin } from '../../utils/bigintMath';
import { matchOwners } from '../../utils/matchOwners';
import {
  compareTransferableInputs,
  compareTransferableOutputs,
} from '../../utils/sort';
import type { SpendOptionsRequired } from './models';

export interface UtxoSpendReturn {
  changeOutputs: TransferableOutput[];
  inputs: TransferableInput[];
  inputUtxos: Utxo[];
  addressMaps: AddressMaps;
}

// UTXO Spend for coreth/AVM UTXOs
export const utxoSpend = (
  amountsToBurn: Map<string, bigint>,
  utxos: Utxo[],
  fromAddresses: Address[],
  options: SpendOptionsRequired,
): UtxoSpendReturn => {
  const inputs: TransferableInput[] = [];
  const changeOutputs: TransferableOutput[] = [];
  const changeOwner = new OutputOwners(
    new BigIntPr(0n),
    new Int(1),
    addressesFromBytes(options.changeAddresses),
  );
  const inputUtxos: Utxo[] = [];
  const addressMaps = new AddressMaps();

  utxos.forEach((utxo) => {
    const remainingAmountToBurn = amountsToBurn.get(utxo.assetId.toString());
    if (!remainingAmountToBurn) {
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
      new TransferableInput(
        utxo.utxoId,
        utxo.assetId,
        TransferInput.fromNative(utxoTransferout.amount(), sigData.sigIndicies),
      ),
    );

    inputUtxos.push(utxo);
    addressMaps.push(sigData.addressMap);

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
  });
  amountsToBurn.forEach((amount, assetId) => {
    if (amount !== 0n) {
      throw new Error(
        `insufficient funds: need ${amount} more units of ${assetId}`,
      );
    }
  });

  inputs.sort(compareTransferableInputs);
  changeOutputs.sort(compareTransferableOutputs);

  return { inputs, changeOutputs, inputUtxos, addressMaps };
};
