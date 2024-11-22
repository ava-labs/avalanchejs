import type { UTXOCalculationState } from '../../utils/calculateSpend';
import {
  TransferableInput,
  TransferableOutput,
} from '../../../serializable/avax';
import {
  OutputOwners,
  TransferOutput,
} from '../../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../../serializable/primitives';
import { addressesFromBytes, isTransferOut } from '../../../utils';
import { bigIntMin } from '../../../utils/bigintMath';
import { verifySignaturesMatch } from '../../../vms/utils/calculateSpend/utils';

// UTXO Spend for coreth/AVM UTXOs
export const useAvmAndCorethUTXOs = ({
  amountsToBurn,
  utxos,
  options,
  changeOutputs,
  inputUTXOs,
  fromAddresses,
  inputs,
  ...state
}: UTXOCalculationState): UTXOCalculationState => {
  const changeOwner = new OutputOwners(
    new BigIntPr(0n),
    new Int(options.threshold),
    addressesFromBytes(options.changeAddresses),
  );
  verifySignaturesMatch(
    utxos
      .filter((utxo) => !!amountsToBurn.get(utxo.assetId.toString()))
      // We only support burning [secp256k1fx.TransferOutput]s.
      .filter((utxo) => !!isTransferOut(utxo.output as TransferOutput)),
    (utxo) => utxo.output as TransferOutput,
    fromAddresses,
    options.minIssuanceTime,
  ).forEach(({ sigData, data: utxo }) => {
    const utxoTransferout = utxo.output as TransferOutput;

    const remainingAmountToBurn =
      amountsToBurn.get(utxo.assetId.toString()) ?? 0n;

    const amountToBurn = bigIntMin(
      remainingAmountToBurn,
      utxoTransferout.amt.value(),
    );
    // if nothing left to burn then lets skip the rest
    if (!amountToBurn) return;

    amountsToBurn.set(
      utxo.assetId.toString(),
      remainingAmountToBurn - amountToBurn,
    );

    inputs.push(
      TransferableInput.fromUtxoAndSigindicies(utxo, sigData.sigIndicies),
    );

    inputUTXOs.push(utxo);

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

  return {
    utxos,
    fromAddresses,
    options,
    ...state,
    amountsToBurn,
    inputs,
    changeOutputs,
    inputUTXOs,
  };
};
