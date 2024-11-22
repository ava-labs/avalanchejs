import { verifySignaturesMatch } from '../../../vms/utils/calculateSpend/utils';
import {
  TransferableOutput,
  TransferOutput,
  TransferableInput,
  TransferInput,
  OutputOwners,
} from '../../../serializable';
import { BigIntPr, Int } from '../../../serializable/primitives';
import type { StakeableLockOut } from '../../../serializable/pvm';
import {
  isTransferOut,
  isStakeableLockOut,
  addressesFromBytes,
} from '../../../utils';
import { bigIntMin } from '../../../utils/bigintMath';
import type { UTXOCalculationState } from '../../utils/calculateSpend';

export function useUnlockedUTXOs({
  amountsToBurn,
  utxos,
  fromAddresses,
  amountsToStake,
  options,
  changeOutputs,
  inputUTXOs,
  inputs,
  stakeOutputs,
  ...state
}: UTXOCalculationState): UTXOCalculationState {
  const changeOwner = new OutputOwners(
    new BigIntPr(0n),
    new Int(1),
    addressesFromBytes(options.changeAddresses),
  );
  const usableUTXOs = utxos.filter((utxo) => {
    if (isTransferOut(utxo.output)) {
      return true;
    }
    const out = utxo.output;
    if (!isStakeableLockOut(out) || !isTransferOut(out.transferOut)) {
      return false;
    }
    return out.getLocktime() < options.minIssuanceTime;
  });

  verifySignaturesMatch(
    usableUTXOs,
    (utxo) => {
      return (
        isTransferOut(utxo.output)
          ? utxo.output
          : (utxo.output as StakeableLockOut).transferOut
      ) as TransferOutput;
    },
    fromAddresses,
    options.minIssuanceTime,
  ).forEach(({ sigData, data: utxo }) => {
    const remainingAmountToBurn = amountsToBurn.get(utxo.assetId.value()) ?? 0n;

    const remainingAmountToStake =
      amountsToStake.get(utxo.assetId.value()) ?? 0n;

    if (!remainingAmountToBurn && !remainingAmountToStake) {
      return;
    }

    const utxoTransferout = (
      isTransferOut(utxo.output)
        ? utxo.output
        : (utxo.output as StakeableLockOut).transferOut
    ) as TransferOutput;

    inputs.push(
      new TransferableInput(
        utxo.utxoId,
        utxo.assetId,
        TransferInput.fromNative(utxoTransferout.amount(), sigData.sigIndicies),
      ),
    );

    inputUTXOs.push(utxo);

    const amountToBurn = bigIntMin(
      remainingAmountToBurn,
      utxoTransferout.amt.value(),
    );

    amountsToBurn.set(
      utxo.assetId.value(),
      remainingAmountToBurn - amountToBurn,
    );

    const amountAvailableToStake = utxoTransferout.amount() - amountToBurn;

    const amountToStake = bigIntMin(
      remainingAmountToStake,
      amountAvailableToStake,
    );

    amountsToStake.set(
      utxo.assetId.value(),
      (amountsToStake.get(utxo.assetId.value()) ?? 0n) - amountToStake,
    );

    if (amountToStake > 0n) {
      stakeOutputs.push(
        new TransferableOutput(
          utxo.assetId,
          new TransferOutput(new BigIntPr(amountToStake), changeOwner),
        ),
      );
    }

    const remainingAmount = amountAvailableToStake - amountToStake;
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
    ...state,
    amountsToBurn,
    utxos,
    fromAddresses,
    amountsToStake,
    options,
    changeOutputs,
    inputUTXOs,
    inputs,
    stakeOutputs,
  };
}
