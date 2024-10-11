import { verifySignaturesMatch } from '../../../vms/utils/calculateSpend/utils';
import {
  TransferableOutput,
  TransferOutput,
  TransferableInput,
  TransferInput,
} from '../../../serializable';
import { BigIntPr } from '../../../serializable/primitives';
import { StakeableLockOut, StakeableLockIn } from '../../../serializable/pvm';
import { isStakeableLockOut } from '../../../utils';
import { bigIntMin } from '../../../utils/bigintMath';
import type { UTXOCalculationState } from '../../utils/calculateSpend';

function createTransferableInput(utxo, lockedOutput, out, sigData) {
  return new TransferableInput(
    utxo.utxoId,
    utxo.assetId,
    new StakeableLockIn(
      lockedOutput.lockTime,
      TransferInput.fromNative(out.amount(), sigData.sigIndicies),
    ),
  );
}

function createTransferableOutput(utxo, lockedOutput, out, amt) {
  return new TransferableOutput(
    utxo.assetId,
    new StakeableLockOut(
      lockedOutput.lockTime,
      new TransferOutput(new BigIntPr(amt), out.outputOwners),
    ),
  );
}

export function useSpendableLockedUTXOs({
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
  const usableUTXOs = utxos
    .filter((utxo) => {
      const out = utxo.output;
      if (!isStakeableLockOut(out)) {
        return false;
      }
      return options.minIssuanceTime < out.getLocktime();
    })
    .map((utxo) => {
      const assetId = utxo.assetId.value();
      // If this is 0n then either we are not staking any of this asset or the amount left to stak is zero
      const remainingAmountToStake = amountsToStake.get(assetId) ?? 0n;
      const lockedOutput = utxo.output as StakeableLockOut;
      return { utxo, assetId, remainingAmountToStake, lockedOutput };
    })
    .filter(({ remainingAmountToStake }) => {
      return !!remainingAmountToStake;
    })
    .filter(({ lockedOutput }) => {
      if (!(lockedOutput.transferOut instanceof TransferOutput)) {
        throw new Error('unknown output type');
      }

      return options.minIssuanceTime < lockedOutput.lockTime.value();
    });
  verifySignaturesMatch(
    usableUTXOs,
    ({ lockedOutput }) => {
      return lockedOutput.transferOut as TransferOutput;
    },
    fromAddresses,
    options.minIssuanceTime,
  ).forEach(({ sigData, data: { utxo, assetId, lockedOutput } }) => {
    const out = lockedOutput.transferOut as TransferOutput;
    const remainingAmountToStake = amountsToStake.get(assetId) ?? 0n;

    // if we have already reached the stake amount then there is nothing left to run beyond here
    if (!remainingAmountToStake) return;

    inputs.push(createTransferableInput(utxo, lockedOutput, out, sigData));

    inputUTXOs.push(utxo);

    // check if this UTXO value is greater than the amount left to stake
    const amountToStake = bigIntMin(remainingAmountToStake, out.amt.value());

    stakeOutputs.push(
      createTransferableOutput(utxo, lockedOutput, out, amountToStake),
    );
    // update the remaining stake amount minus this UTXOs value
    amountsToStake.set(assetId, remainingAmountToStake - amountToStake);
    const remainingAmount = out.amount() - amountToStake;

    if (remainingAmount > 0n) {
      changeOutputs.push(
        createTransferableOutput(utxo, lockedOutput, out, remainingAmount),
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
