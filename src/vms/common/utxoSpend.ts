import { TransferableInput, TransferableOutput } from '../../serializable/avax';
import type { Utxo } from '../../serializable/avax/utxo';
import { Address } from '../../serializable/fxs/common';
import {
  Input,
  OutputOwners,
  TransferInput,
  TransferOutput,
} from '../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../serializable/primitives';
import { bigIntMin } from '../../utils/bigintMath';
import { matchOwners } from '../../utils/matchOwners';
import {
  compareTransferableInputs,
  compareTransferableOutputs,
} from '../../utils/sort';
import { addressesToHexes } from '../utils/addressesToHexes';
import type { SpendOptionsRequired } from './models';

// UTXO Spend for coreth/AVM UTXOs
export const utxoSpend = (
  amountsToBurn: Map<string, bigint>,
  utxos: Utxo[],
  fromAddresses: string[],
  options: SpendOptionsRequired,
) => {
  const inputs: TransferableInput[] = [];
  const changeOutputs: TransferableOutput[] = [];
  const changeOwner = new OutputOwners(
    new BigIntPr(0n),
    new Int(1),
    options.changeAddresses.map((addr) => Address.fromString(addr)),
  );
  const fromAddresseshex = addressesToHexes(fromAddresses);
  const inputUtxos: Utxo[] = [];
  utxos.forEach((utxo) => {
    const remainingAmountToBurn = amountsToBurn.get(utxo.assetId.toString());
    if (!remainingAmountToBurn) {
      return;
    }
    if (!(utxo.output instanceof TransferOutput)) {
      // We only support burning [secp256k1fx.TransferOutput]s.
      return;
    }
    const utxoTransferout = utxo.output as TransferOutput;

    const inputSigIndicies = matchOwners(
      utxoTransferout.outputOwners,
      new Set(fromAddresseshex),
      options.minIssuanceTime,
    );
    if (!inputSigIndicies) {
      return;
    }

    inputs.push(
      new TransferableInput(
        utxo.utxoId,
        utxo.assetId,
        new TransferInput(utxoTransferout.amt, new Input(inputSigIndicies)),
      ),
    );

    inputUtxos.push(utxo);

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

  return { inputs, changeOutputs, inputUtxos };
};
