import type { Address } from '../../../serializable';
import {
  BigIntPr,
  OutputOwners,
  TransferInput,
  TransferableInput,
  TransferableOutput,
  TransferOutput,
  Id,
} from '../../../serializable';
import type { Utxo } from '../../../serializable/avax/utxo';
import { StakeableLockIn, StakeableLockOut } from '../../../serializable/pvm';
import { getUtxoInfo, isStakeableLockOut, isTransferOut } from '../../../utils';
import type { SpendOptions } from '../../common';
import type { Dimensions } from '../../common/fees/dimensions';
import type { Context } from '../../context';
import { verifySignaturesMatch } from '../../utils/calculateSpend/utils';
import { SpendHelper } from './spendHelper';

type SpendResult = Readonly<{
  /**
   * The consolidated and sorted change outputs.
   */
  changeOutputs: readonly TransferableOutput[];
  /**
   * The total calculated fee for the transaction.
   */
  fee: bigint;
  /**
   * The sorted inputs.
   */
  inputs: readonly TransferableInput[];
  /**
   * The UTXOs that were used as inputs.
   */
  inputUTXOs: readonly Utxo[];
  /**
   * The consolidated and sorted staked outputs.
   */
  stakeOutputs: readonly TransferableOutput[];
}>;

export type SpendProps = Readonly<{
  /**
   * The initial complexity of the transaction.
   */
  complexity: Dimensions;
  /**
   * The extra AVAX that spend can produce in
   * the change outputs in addition to the consumed and not burned AVAX.
   */
  excessAVAX?: bigint;
  /**
   * List of Addresses that are used for selecting which UTXOs are signable.
   */
  fromAddresses: readonly Address[];
  /**
   * Optionally specifies the output owners to use for the unlocked
   * AVAX change output if no additional AVAX was needed to be burned.
   * If this value is `undefined` or `null`, the default change owner is used.
   *
   * Used in ImportTx.
   */
  ownerOverride?: OutputOwners | null;
  spendOptions: Required<SpendOptions>;
  /**
   * Maps `assetID` to the amount of the asset to spend without
   * producing an output. This is typically used for fees.
   * However, it can also be used to consume some of an asset that
   * will be produced in separate outputs, such as ExportedOutputs.
   *
   * Only unlocked UTXOs are able to be burned here.
   */
  toBurn?: Map<string, bigint>;
  /**
   * Maps `assetID` to the amount of the asset to spend and place info
   * the staked outputs. First locked UTXOs are attempted to be used for
   * these funds, and then unlocked UTXOs will be attempted to be used.
   * There is no preferential ordering on the unlock times.
   */
  toStake?: Map<string, bigint>;
  /**
   * List of UTXOs that are available to be spent.
   */
  utxos: readonly Utxo[];
}>;

type SpendReducerState = Readonly<Required<SpendProps>>;

type SpendReducerFunction = (
  state: SpendReducerState,
  spendHelper: SpendHelper,
  context: Context,
) => SpendReducerState;

const verifyAssetsConsumed: SpendReducerFunction = (state, spendHelper) => {
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

export const handleFee: SpendReducerFunction = (
  state,
  spendHelper,
  context,
) => {
  const requiredFee = spendHelper.calculateFee();

  if (state.excessAVAX < requiredFee) {
    throw new Error(
      `Insufficient funds: provided UTXOs need ${
        requiredFee - state.excessAVAX
      } more nAVAX (asset id: ${context.avaxAssetID})`,
    );
  }

  // No need to add a change output.
  if (state.excessAVAX === requiredFee) {
    return state;
  }

  // Use the change owner override if it exists, otherwise use the default change owner.
  // This is used for import transactions.
  const changeOwners =
    state.ownerOverride ||
    OutputOwners.fromNative(state.spendOptions.changeAddresses);

  // TODO: Clean-up if this is no longer needed.
  // Additionally, no need for public .addOutputComplexity().
  //
  // Pre-consolidation code.
  //
  // spendHelper.addOutputComplexity(
  //   new TransferableOutput(
  //     Id.fromString(context.avaxAssetID),
  //     new TransferOutput(new BigIntPr(0n), changeOwners),
  //   ),
  // );
  //
  // Recalculate the fee with the change output.
  // const requiredFeeWithChange = spendHelper.calculateFee();

  // Calculate the fee with a temporary output complexity if a change output is needed.
  const requiredFeeWithChange: bigint = spendHelper.hasChangeOutput(
    context.avaxAssetID,
    changeOwners,
  )
    ? requiredFee
    : spendHelper.calculateFeeWithTemporaryOutputComplexity(
        new TransferableOutput(
          Id.fromString(context.avaxAssetID),
          new TransferOutput(new BigIntPr(0n), changeOwners),
        ),
      );

  // Add a change output if needed.
  if (state.excessAVAX > requiredFeeWithChange) {
    // It is worth adding the change output.
    spendHelper.addChangeOutput(
      new TransferableOutput(
        Id.fromString(context.avaxAssetID),
        new TransferOutput(
          new BigIntPr(state.excessAVAX - requiredFeeWithChange),
          changeOwners,
        ),
      ),
    );
  }

  return state;
};

/**
 * Processes the spending of assets, including burning and staking, from a list of UTXOs.
 *
 * @param {SpendProps} props - The properties required to execute the spend operation.
 * @param {SpendReducerFunction[]} spendReducers - The list of functions that will be executed to process the spend operation.
 * @param {Context} context - The context in which the spend operation is executed.
 *
 * @returns {[null, SpendResult] | [Error, null]} - A tuple where the first element is either null or an error,
 * and the second element is either the result of the spend operation or null.
 */
export const spend = (
  {
    complexity,
    excessAVAX: _excessAVAX = 0n,
    fromAddresses,
    ownerOverride,
    spendOptions,
    toBurn = new Map(),
    toStake = new Map(),
    utxos,
  }: SpendProps,
  // spendReducers: readonly SpendReducerFunction[],
  context: Context,
):
  | [error: null, inputsAndOutputs: SpendResult]
  | [error: Error, inputsAndOutputs: null] => {
  try {
    const changeOwners =
      ownerOverride || OutputOwners.fromNative(spendOptions.changeAddresses);
    const excessAVAX: bigint = _excessAVAX;

    const spendHelper = new SpendHelper({
      changeOutputs: [],
      complexity,
      gasPrice: context.gasPrice,
      inputs: [],
      stakeOutputs: [],
      toBurn,
      toStake,
      weights: context.complexityWeights,
    });

    const initialState: SpendReducerState = {
      complexity,
      excessAVAX,
      fromAddresses,
      ownerOverride: changeOwners,
      spendOptions,
      toBurn,
      toStake,
      utxos,
    };

    const spendReducerFunctions: readonly SpendReducerFunction[] = [
      // ...spendReducers,
      useSpendableLockedUTXOs,
      useUnlockedUTXOs,
      verifyAssetsConsumed,
      handleFee,
      // Consolidation and sorting happens in the SpendHelper.
    ];

    // Run all the spend calculation reducer logic.
    spendReducerFunctions.reduce((state, next) => {
      return next(state, spendHelper, context);
    }, initialState);

    return [null, spendHelper.getInputsOutputs()];
  } catch (error) {
    return [
      error instanceof Error
        ? error
        : new Error('An unexpected error occurred during spend calculation'),
      null,
    ];
  }
};
