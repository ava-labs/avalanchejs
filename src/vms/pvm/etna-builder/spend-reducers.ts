import {
  BigIntPr,
  Id,
  OutputOwners,
  TransferInput,
  TransferOutput,
  TransferableInput,
  TransferableOutput,
} from '../../../serializable';
import type { Utxo } from '../../../serializable/avax/utxo';
import { StakeableLockIn, StakeableLockOut } from '../../../serializable/pvm';
import { getUtxoInfo, isStakeableLockOut, isTransferOut } from '../../../utils';
import type { Context } from '../../context';
import { verifySignaturesMatch } from '../../utils/calculateSpend/utils';
import type { SpendProps } from './spend';
import type { SpendHelper } from './spendHelper';

export type SpendReducerState = Readonly<
  Required<Omit<SpendProps, 'shouldConsolidateOutputs'>>
>;

export type SpendReducerFunction = (
  state: SpendReducerState,
  spendHelper: SpendHelper,
  context: Context,
) => SpendReducerState;

export const verifyAssetsConsumed: SpendReducerFunction = (
  state,
  spendHelper,
) => {
  const verifyError = spendHelper.verifyAssetsConsumed();

  if (verifyError) {
    throw verifyError;
  }

  return state;
};

export const IncorrectStakeableLockOutError = new Error(
  'StakeableLockOut transferOut must be a TransferOutput.',
);

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

export const useUnlockedUTXOs: SpendReducerFunction = (
  state,
  spendHelper,
  context,
) => {
  // 1. Filter out the UTXOs that are not usable.
  const usableUTXOs: Utxo<TransferOutput | StakeableLockOut<TransferOutput>>[] =
    state.utxos
      // Filter out non stakeable lockouts and lockouts that are not stakeable yet.
      .filter(
        (
          utxo,
        ): utxo is Utxo<TransferOutput | StakeableLockOut<TransferOutput>> => {
          if (isTransferOut(utxo.output)) {
            return true;
          }

          if (isStakeableLockOut(utxo.output)) {
            if (!isTransferOut(utxo.output.transferOut)) {
              throw IncorrectStakeableLockOutError;
            }

            return (
              utxo.output.getLocktime() < state.spendOptions.minIssuanceTime
            );
          }

          return false;
        },
      );

  // 2. Verify signatures match.
  const verifiedUsableUTXOs = verifySignaturesMatch(
    usableUTXOs,
    (utxo) =>
      isTransferOut(utxo.output) ? utxo.output : utxo.output.transferOut,
    state.fromAddresses,
    state.spendOptions,
  );

  // 3. Split verified usable UTXOs into AVAX assetId UTXOs and other assetId UTXOs.
  const [otherVerifiedUsableUTXOs, avaxVerifiedUsableUTXOs] =
    verifiedUsableUTXOs.reduce(
      (result, { sigData, data: utxo }) => {
        if (utxo.assetId.value() === context.avaxAssetID) {
          return [result[0], [...result[1], { sigData, data: utxo }]];
        }

        return [[...result[0], { sigData, data: utxo }], result[1]];
      },
      [[], []] as [
        other: typeof verifiedUsableUTXOs,
        avax: typeof verifiedUsableUTXOs,
      ],
    );

  // 4. Handle all the non-AVAX asset UTXOs first.
  for (const { sigData, data: utxo } of otherVerifiedUsableUTXOs) {
    const utxoInfo = getUtxoInfo(utxo);
    const remainingAmountToBurn: bigint =
      state.toBurn.get(utxoInfo.assetId) ?? 0n;
    const remainingAmountToStake: bigint =
      state.toStake.get(utxoInfo.assetId) ?? 0n;

    // 4a. If we have already reached the burn/stake amount, there is nothing left to run beyond here.
    if (remainingAmountToBurn === 0n && remainingAmountToStake === 0n) {
      continue;
    }

    // 4b. Add the input.
    spendHelper.addInput(
      utxo,
      new TransferableInput(
        utxo.utxoId,
        utxo.assetId,
        TransferInput.fromNative(utxoInfo.amount, sigData.sigIndicies),
      ),
    );

    // 4c. Consume the asset and get the remaining amount.
    const remainingAmount = spendHelper.consumeAsset(
      utxoInfo.assetId,
      utxoInfo.amount,
    );

    // 4d. If "amountToStake" is greater than 0, add the stake output.
    // TODO: Implement or determine if needed.

    // 4e. Add the change output if there is any remaining amount.
    if (remainingAmount > 0n) {
      spendHelper.addChangeOutput(
        new TransferableOutput(
          utxo.assetId,
          new TransferableOutput(
            utxo.assetId,
            new TransferOutput(
              new BigIntPr(remainingAmount),
              OutputOwners.fromNative(
                state.spendOptions.changeAddresses,
                0n,
                1,
              ),
            ),
          ),
        ),
      );
    }
  }

  // 5. Handle AVAX asset UTXOs last to account for fees.
  let excessAVAX = state.excessAVAX;
  let clearOwnerOverride = false;
  for (const { sigData, data: utxo } of avaxVerifiedUsableUTXOs) {
    const requiredFee = spendHelper.calculateFee();

    // If we don't need to burn or stake additional AVAX and we have
    // consumed enough AVAX to pay the required fee, we should stop
    // consuming UTXOs.
    if (
      !spendHelper.shouldConsumeAsset(context.avaxAssetID) &&
      excessAVAX >= requiredFee
    ) {
      break;
    }

    const utxoInfo = getUtxoInfo(utxo);

    spendHelper.addInput(
      utxo,
      new TransferableInput(
        utxo.utxoId,
        utxo.assetId,
        TransferInput.fromNative(utxoInfo.amount, sigData.sigIndicies),
      ),
    );

    const remainingAmount = spendHelper.consumeAsset(
      context.avaxAssetID,
      utxoInfo.amount,
    );

    excessAVAX += remainingAmount;

    // The ownerOverride is no longer needed. Clear it.
    clearOwnerOverride = true;
  }

  return {
    ...state,
    excessAVAX,
    ownerOverride: clearOwnerOverride ? null : state.ownerOverride,
  };
};

/**
 * Determines if the fee can be covered by the excess AVAX.
 *
 * @returns {boolean} - Whether the excess AVAX exceeds the fee. `true` greater than the fee, `false` if equal.
 * @throws {Error} - If the excess AVAX is less than the required fee.
 */
const canPayFeeAndNeedsChange = (
  excessAVAX: bigint,
  requiredFee: bigint,
  context: Context,
): boolean => {
  // Not enough funds to pay the fee.
  if (excessAVAX < requiredFee) {
    throw new Error(
      `Insufficient funds: provided UTXOs need ${
        requiredFee - excessAVAX
      } more nAVAX (asset id: ${context.avaxAssetID})`,
    );
  }

  // No need to add a change to change output.
  // Just burn the fee.
  if (excessAVAX === requiredFee) {
    return false;
  }

  return true;
};

export const handleFeeAndChange: SpendReducerFunction = (
  state,
  spendHelper,
  context,
) => {
  // Use the change owner override if it exists, otherwise use the default change owner.
  // This is used on "import" transactions.
  const changeOwners =
    state.ownerOverride ??
    OutputOwners.fromNative(state.spendOptions.changeAddresses);

  const requiredFee = spendHelper.calculateFee();

  // Checks for an existing change output that is for the AVAX asset assigned to the change owner.
  const hasExistingChangeOutput: boolean = spendHelper.hasChangeOutput(
    context.avaxAssetID,
    changeOwners,
  );

  if (canPayFeeAndNeedsChange(state.excessAVAX, requiredFee, context)) {
    if (hasExistingChangeOutput) {
      // Excess exceeds fee, return the change.
      // This output will get consolidated with the existing output.
      spendHelper.addChangeOutput(
        new TransferableOutput(
          Id.fromString(context.avaxAssetID),
          new TransferOutput(
            new BigIntPr(state.excessAVAX - requiredFee),
            changeOwners,
          ),
        ),
      );
    } else {
      // Calculate the fee with a temporary output complexity
      // as if we added the change output.
      const requiredFeeWithChangeOutput =
        spendHelper.calculateFeeWithTemporaryOutputComplexity(
          new TransferableOutput(
            Id.fromString(context.avaxAssetID),
            new TransferOutput(new BigIntPr(0n), changeOwners),
          ),
        );

      // If the excess AVAX is greater than the new fee, add a change output.
      // Otherwise, ignore and burn the excess because it can't be returned
      // (ie we can't pay the fee to return the excess).
      if (state.excessAVAX > requiredFeeWithChangeOutput) {
        spendHelper.addChangeOutput(
          new TransferableOutput(
            Id.fromString(context.avaxAssetID),
            new TransferOutput(
              new BigIntPr(state.excessAVAX - requiredFeeWithChangeOutput),
              changeOwners,
            ),
          ),
        );
      }
    }
  }

  return state;
};
