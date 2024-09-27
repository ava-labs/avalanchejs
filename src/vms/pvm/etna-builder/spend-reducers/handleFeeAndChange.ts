import {
  BigIntPr,
  Id,
  OutputOwners,
  TransferOutput,
  TransferableOutput,
} from '../../../../serializable';
import type { Context } from '../../../context';
import type { SpendReducerFunction } from './types';

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
      const requiredFeeWithChangeOutput = spendHelper.calculateFee(
        new TransferableOutput(
          Id.fromString(context.avaxAssetID),
          new TransferOutput(new BigIntPr(0n), changeOwners),
        ),
      );

      // If the excess AVAX is greater than the new fee, add a change output.
      // Otherwise, ignore and burn the excess because it can't be returned
      // (ie there is no point in adding a change output if you can't afford to add it).
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
