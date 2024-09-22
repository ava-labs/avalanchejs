import {
  BigIntPr,
  TransferInput,
  TransferOutput,
  TransferableInput,
  TransferableOutput,
} from '../../../../serializable';
import type { Utxo } from '../../../../serializable/avax/utxo';
import {
  StakeableLockIn,
  StakeableLockOut,
} from '../../../../serializable/pvm';
import {
  getUtxoInfo,
  isStakeableLockOut,
  isTransferOut,
} from '../../../../utils';
import { verifySignaturesMatch } from '../../../utils/calculateSpend/utils';
import { IncorrectStakeableLockOutError } from './errors';
import type { SpendReducerFunction } from './types';

export const useSpendableLockedUTXOs: SpendReducerFunction = (
  state,
  spendHelper,
) => {
  // 1. Filter out the UTXOs that are not usable.
  const usableUTXOs: Utxo<StakeableLockOut<TransferOutput>>[] = state.utxos
    // Filter out non stakeable lockouts and lockouts that are not stakeable yet.
    .filter((utxo): utxo is Utxo<StakeableLockOut<TransferOutput>> => {
      // 1a. Ensure UTXO output is a StakeableLockOut.
      if (!isStakeableLockOut(utxo.output)) {
        return false;
      }

      // 1b. Ensure UTXO is stakeable.
      if (!(state.spendOptions.minIssuanceTime < utxo.output.getLocktime())) {
        return false;
      }

      // 1c. Ensure there are funds to stake.
      if ((state.toStake.get(utxo.assetId.value()) ?? 0n) === 0n) {
        return false;
      }

      // 1d. Ensure transferOut is a TransferOutput.
      if (!isTransferOut(utxo.output.transferOut)) {
        throw IncorrectStakeableLockOutError;
      }

      return true;
    });

  // 2. Verify signatures match.
  const verifiedUsableUTXOs = verifySignaturesMatch(
    usableUTXOs,
    (utxo) => utxo.output.transferOut,
    state.fromAddresses,
    state.spendOptions,
  );

  // 3. Do all the logic for spending based on the UTXOs.
  for (const { sigData, data: utxo } of verifiedUsableUTXOs) {
    const utxoInfo = getUtxoInfo(utxo);
    const remainingAmountToStake: bigint =
      state.toStake.get(utxoInfo.assetId) ?? 0n;

    // 3a. If we have already reached the stake amount, there is nothing left to run beyond here.
    if (remainingAmountToStake === 0n) {
      continue;
    }

    // 3b. Add the input.
    spendHelper.addInput(
      utxo,
      new TransferableInput(
        utxo.utxoId,
        utxo.assetId,
        new StakeableLockIn(
          // StakeableLockOut
          new BigIntPr(utxoInfo.stakeableLocktime),
          TransferInput.fromNative(
            // TransferOutput
            utxoInfo.amount,
            sigData.sigIndicies,
          ),
        ),
      ),
    );

    // 3c. Consume the locked asset and get the remaining amount.
    const remainingAmount = spendHelper.consumeLockedAsset(
      utxoInfo.assetId,
      utxoInfo.amount,
    );

    // 3d. Add the stake output.
    spendHelper.addStakedOutput(
      new TransferableOutput(
        utxo.assetId,
        new StakeableLockOut(
          new BigIntPr(utxoInfo.stakeableLocktime),
          new TransferOutput(
            new BigIntPr(utxoInfo.amount - remainingAmount),
            utxo.getOutputOwners(),
          ),
        ),
      ),
    );

    // 3e. Add the change output if there is any remaining amount.
    if (remainingAmount > 0n) {
      spendHelper.addChangeOutput(
        new TransferableOutput(
          utxo.assetId,
          new StakeableLockOut(
            new BigIntPr(utxoInfo.stakeableLocktime),
            new TransferOutput(
              new BigIntPr(remainingAmount),
              utxo.getOutputOwners(),
            ),
          ),
        ),
      );
    }
  }

  // 4. Add all remaining stake amounts assuming they are unlocked.
  for (const [assetId, amount] of state.toStake) {
    if (amount === 0n) {
      continue;
    }

    spendHelper.addStakedOutput(
      TransferableOutput.fromNative(
        assetId,
        amount,
        state.spendOptions.changeAddresses,
      ),
    );
  }

  return state;
};
