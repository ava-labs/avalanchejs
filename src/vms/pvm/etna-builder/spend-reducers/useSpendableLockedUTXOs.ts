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
  matchOwners,
} from '../../../../utils';
import {
  NoSigMatchError,
  selectSignaturesMatch,
} from '../../../utils/calculateSpend/utils';
import { IncorrectStakeableLockOutError } from './errors';
import type { SpendReducerFunction, SpendReducerState } from './types';

/**
 * Is responsible for filtering out the usable UTXOs from the list of UTXOs.
 *
 * @internal - Only exported for testing.
 */
export const getUsableUTXOsFilter =
  (state: SpendReducerState) =>
  (utxo: Utxo): utxo is Utxo<StakeableLockOut<TransferOutput>> => {
    // 1a. Ensure UTXO output is a StakeableLockOut.
    if (!isStakeableLockOut(utxo.output)) {
      return false;
    }

    // 1b. Ensure UTXO is stakeable.
    if (state.minIssuanceTime >= utxo.output.getLocktime()) {
      return false;
    }

    // 1c. Ensure transferOut is a TransferOutput.
    if (!isTransferOut(utxo.output.transferOut)) {
      throw IncorrectStakeableLockOutError;
    }

    // 1d. Filter out UTXOs that aren't needed for staking.
    if (!state.toStake.has(utxo.assetId.value())) {
      return false;
    }

    return true;
  };

/**
 * Reducer function that is responsible for spending UTXOs that are locked and stakeable.
 *
 * NOTE: Time locked UTXOs can not be used to pay fees.
 */
export const useSpendableLockedUTXOs: SpendReducerFunction = (
  state,
  spendHelper,
) => {
  // 1. Filter out the UTXOs that are not usable.
  const usableUTXOs: Utxo<StakeableLockOut<TransferOutput>>[] = state.utxos
    // Filter out non stakeable lockouts and lockouts that are not stakeable yet.
    .filter(getUsableUTXOsFilter(state));

  // 2. Keep only the locked UTXOs this caller can actually sign for.
  //
  // An unsignable locked UTXO is skipped rather than aborting the spend.
  // getUsableUTXOsFilter selects by shape alone, and any third party can put
  // a matching shape in the victim's UTXO set (a StakeableLockOut naming them
  // among N-of-M owners, or with a future inner-owners locktime). Treating
  // that as fatal would stop the spend before useUnlockedUTXOs ever saw the
  // caller's own spendable UTXOs.
  const verifiedUsableUTXOs = selectSignaturesMatch(
    usableUTXOs,
    (utxo) => utxo.output.transferOut,
    state.fromAddresses,
    state.minIssuanceTime,
  );

  // A signature mismatch is still an error — just not one a foreign UTXO can
  // trigger. It is fatal only when *nothing* the caller passed is signable,
  // which is the case the original check was written for: fromAddresses does
  // not correspond to these UTXOs, so the transaction is misformulated.
  // Judging that against the whole UTXO set rather than this shape-filtered
  // subset is the entire difference.
  if (usableUTXOs.length > 0 && verifiedUsableUTXOs.length === 0) {
    const hasAnySignableUTXO = state.utxos.some((utxo) => {
      const output = isStakeableLockOut(utxo.output)
        ? utxo.output.transferOut
        : utxo.output;

      return (
        isTransferOut(output) &&
        matchOwners(
          output.outputOwners,
          [...state.fromAddresses],
          state.minIssuanceTime,
        ) !== undefined
      );
    });

    if (!hasAnySignableUTXO) {
      throw NoSigMatchError;
    }
  }

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
          new BigIntPr(utxoInfo.stakeableLocktime),
          TransferInput.fromNative(utxoInfo.amount, sigData.sigIndicies),
        ),
      ),
    );

    // 3c. Consume the locked asset and get the remaining amount.
    const [remainingAmount] = spendHelper.consumeLockedStakableAsset(
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

  return state;
};
