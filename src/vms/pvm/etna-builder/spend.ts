import type { Address } from '../../../serializable';
import {
  BigIntPr,
  Id,
  Input,
  OutputOwners,
  TransferInput,
  TransferOutput,
  TransferableInput,
  TransferableOutput,
} from '../../../serializable';
import type { Utxo } from '../../../serializable/avax/utxo';
import { StakeableLockIn, StakeableLockOut } from '../../../serializable/pvm';
import { isStakeableLockOut, isTransferOut } from '../../../utils';
import { matchOwners } from '../../../utils/matchOwners';
import type { SpendOptions } from '../../common';
import type { Dimensions } from '../../common/fees/dimensions';
import type { Serializable } from '../../common/types';
import type { Context } from '../../context';
import { SpendHelper } from './spendHelper';

/**
 * @internal
 *
 * Separates the provided UTXOs into two lists:
 * - `locked` contains UTXOs that have a locktime greater than or equal to `minIssuanceTime`.
 * - `unlocked` contains UTXOs that have a locktime less than `minIssuanceTime`.
 *
 * @param utxos {readonly Utxo[]}
 * @param minIssuanceTime {bigint}
 *
 * @returns Object containing two lists of UTXOs.
 */
export const splitByLocktime = (
  utxos: readonly Utxo[],
  minIssuanceTime: bigint,
): { readonly locked: readonly Utxo[]; readonly unlocked: readonly Utxo[] } => {
  const locked: Utxo[] = [];
  const unlocked: Utxo[] = [];

  for (const utxo of utxos) {
    let utxoOwnersLocktime: bigint;

    try {
      utxoOwnersLocktime = utxo.getOutputOwners().locktime.value();
    } catch (error) {
      // If we can't get the locktime, we can't spend the UTXO.
      // TODO: Is this the right thing to do?
      // This was necessary to get tests working with testUtxos().
      continue;
    }

    if (minIssuanceTime < utxoOwnersLocktime) {
      locked.push(utxo);
    } else {
      unlocked.push(utxo);
    }
  }

  return { locked, unlocked };
};

/**
 * @internal
 *
 * Separates the provided UTXOs into two lists:
 * - `other` contains UTXOs that have an asset ID different from `assetId`.
 * - `requested` contains UTXOs that have an asset ID equal to `assetId`.
 *
 * @param utxos {readonly Utxo[]}
 * @param assetId {string}
 *
 * @returns Object containing two lists of UTXOs.
 */
export const splitByAssetId = (
  utxos: readonly Utxo[],
  assetId: string,
): { readonly other: readonly Utxo[]; readonly requested: readonly Utxo[] } => {
  const other: Utxo[] = [];
  const requested: Utxo[] = [];

  for (const utxo of utxos) {
    if (assetId === utxo.assetId.toString()) {
      requested.push(utxo);
    } else {
      other.push(utxo);
    }
  }

  return { other, requested };
};

/**
 * @internal
 *
 * Returns the TransferOutput that was, potentially, wrapped by a stakeable lockout.
 *
 * If the output was stakeable and locked, the locktime is returned.
 * Otherwise, the locktime returned will be 0n.
 *
 * If the output is not an error is returned.
 */
export const unwrapOutput = (
  output: Serializable,
):
  | [error: null, transferOutput: TransferOutput, locktime: bigint]
  | [error: Error, transferOutput: null, locktime: null] => {
  try {
    if (isStakeableLockOut(output) && isTransferOut(output.transferOut)) {
      return [null, output.transferOut, output.lockTime.value()];
    } else if (isTransferOut(output)) {
      return [null, output, 0n];
    }
  } catch (error) {
    return [
      new Error('An unexpected error occurred while unwrapping output', {
        cause: error instanceof Error ? error : undefined,
      }),
      null,
      null,
    ];
  }

  return [new Error('Unknown output type'), null, null];
};

type SpendResult = Readonly<{
  changeOutputs: readonly TransferableOutput[];
  inputs: readonly TransferableInput[];
  inputUTXOs: readonly Utxo[];
  stakeOutputs: readonly TransferableOutput[];
}>;

type SpendProps = Readonly<{
  /**
   * Contains the currently accrued transaction complexity that
   * will be used to calculate the required fees to be burned.
   */
  complexity: Dimensions;
  /**
   * Contains the amount of extra AVAX that spend can produce in
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
   * If this value is `undefined`, the default change owner is used.
   */
  ownerOverride?: OutputOwners;
  spendOptions: Required<SpendOptions>;
  /**
   * Maps `assetID` to the amount of the asset to spend without
   * producing an output. This is typically used for fees.
   * However, it can also be used to consume some of an asset that
   * will be produced in separate outputs, such as ExportedOutputs.
   *
   * Only unlocked UTXOs are able to be burned here.
   */
  toBurn: Map<string, bigint>;
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

/**
 * Processes the spending of assets, including burning and staking, from a list of UTXOs.
 *
 * @param {SpendProps} props - The properties required to execute the spend operation.
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
    ownerOverride: _ownerOverride,
    spendOptions,
    toBurn,
    toStake = new Map(),
    utxos,
  }: SpendProps,
  context: Context,
):
  | [error: null, inputsAndOutputs: SpendResult]
  | [error: Error, inputsAndOutputs: null] => {
  try {
    let ownerOverride =
      _ownerOverride || OutputOwners.fromNative(spendOptions.changeAddresses);
    let excessAVAX: bigint = _excessAVAX;

    const spendHelper = new SpendHelper({
      changeOutputs: [],
      complexity,
      gasPrice: context.gasPrice,
      inputs: [],
      stakeOutputs: [],
      toBurn,
      toStake: toStake ?? new Map(),
      weights: context.complexityWeights,
    });

    const utxosByLocktime = splitByLocktime(
      utxos,
      spendOptions.minIssuanceTime,
    );

    for (const utxo of utxosByLocktime.locked) {
      if (!spendHelper.shouldConsumeLockedAsset(utxo.assetId.toString())) {
        continue;
      }

      const [unwrapError, out, locktime] = unwrapOutput(utxo.output);

      if (unwrapError) {
        return [unwrapError, null];
      }

      const { sigIndicies: inputSigIndices } =
        matchOwners(
          out.outputOwners,
          [...fromAddresses],
          spendOptions.minIssuanceTime,
        ) || {};

      if (inputSigIndices === undefined) {
        // We couldn't spend this UTXO, so we skip to the next one.
        continue;
      }

      spendHelper.addInput(
        utxo,
        // TODO: Verify this.
        new TransferableInput(
          utxo.utxoId,
          utxo.assetId,
          new StakeableLockIn(
            new BigIntPr(locktime),
            new TransferInput(out.amt, Input.fromNative(inputSigIndices)),
          ),
        ),
      );

      const excess = spendHelper.consumeLockedAsset(
        utxo.assetId.toString(),
        out.amount(),
      );

      spendHelper.addStakedOutput(
        // TODO: Verify this.
        new TransferableOutput(
          utxo.assetId,
          new StakeableLockOut(
            new BigIntPr(locktime),
            new TransferOutput(
              new BigIntPr(out.amount() - excess),
              out.outputOwners,
            ),
          ),
        ),
      );

      if (excess === 0n) {
        continue;
      }

      // This input had extra value, so some of it must be returned as change.
      spendHelper.addChangeOutput(
        // TODO: Verify this.
        new TransferableOutput(
          utxo.assetId,
          new StakeableLockOut(
            new BigIntPr(locktime),
            new TransferOutput(new BigIntPr(excess), out.outputOwners),
          ),
        ),
      );
    }

    // Add all remaining stake amounts assuming unlocked UTXOs
    for (const [assetId, amount] of toStake) {
      if (amount === 0n) {
        continue;
      }

      spendHelper.addStakedOutput(
        TransferableOutput.fromNative(
          assetId,
          amount,
          spendOptions.changeAddresses,
        ),
      );
    }

    // AVAX is handled last to account for fees.
    const utxosByAVAXAssetId = splitByAssetId(
      utxosByLocktime.unlocked,
      context.avaxAssetID,
    );

    for (const utxo of utxosByAVAXAssetId.other) {
      const assetId = utxo.assetId.toString();

      if (!spendHelper.shouldConsumeAsset(assetId)) {
        continue;
      }

      const [unwrapError, out] = unwrapOutput(utxo.output);

      if (unwrapError) {
        return [unwrapError, null];
      }

      const { sigIndicies: inputSigIndices } =
        matchOwners(
          out.outputOwners,
          [...fromAddresses],
          spendOptions.minIssuanceTime,
        ) || {};

      if (inputSigIndices === undefined) {
        // We couldn't spend this UTXO, so we skip to the next one.
        continue;
      }

      spendHelper.addInput(
        utxo,
        // TODO: Verify this.
        // TransferableInput.fromUtxoAndSigindicies(utxo, inputSigIndices),
        new TransferableInput(
          utxo.utxoId,
          utxo.assetId,
          new TransferInput(out.amt, Input.fromNative(inputSigIndices)),
        ),
      );

      const excess = spendHelper.consumeAsset(assetId, out.amount());

      if (excess === 0n) {
        continue;
      }

      // This input had extra value, so some of it must be returned as change.
      spendHelper.addChangeOutput(
        // TODO: Verify this.
        new TransferableOutput(
          utxo.assetId,
          new TransferOutput(
            new BigIntPr(excess),
            OutputOwners.fromNative(spendOptions.changeAddresses),
          ),
        ),
      );
    }

    for (const utxo of utxosByAVAXAssetId.requested) {
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

      const [error, out] = unwrapOutput(utxo.output);

      if (error) {
        return [error, null];
      }

      const { sigIndicies: inputSigIndices } =
        matchOwners(
          out.outputOwners,
          [...fromAddresses],
          spendOptions.minIssuanceTime,
        ) || {};

      if (inputSigIndices === undefined) {
        // We couldn't spend this UTXO, so we skip to the next one.
        continue;
      }

      spendHelper.addInput(
        utxo,
        // TODO: Verify this.
        new TransferableInput(
          utxo.utxoId,
          utxo.assetId,
          new TransferInput(out.amt, Input.fromNative(inputSigIndices)),
        ),
      );

      const excess = spendHelper.consumeAsset(
        context.avaxAssetID,
        out.amount(),
      );

      excessAVAX += excess;

      // If we need to consume additional AVAX, we should be returning the
      // change to the change address.
      ownerOverride = OutputOwners.fromNative(spendOptions.changeAddresses);
    }

    // Verify
    const verifyError = spendHelper.verifyAssetsConsumed();
    if (verifyError) {
      return [verifyError, null];
    }

    const requiredFee = spendHelper.calculateFee();

    if (excessAVAX < requiredFee) {
      throw new Error(
        `Insufficient funds: provided UTXOs need ${
          requiredFee - excessAVAX
        } more nAVAX (${context.avaxAssetID})`,
      );
    }

    // NOTE: This logic differs a bit from avalanche go because our classes are immutable.
    spendHelper.addOutputComplexity(
      new TransferableOutput(
        Id.fromString(context.avaxAssetID),
        new TransferOutput(new BigIntPr(0n), ownerOverride),
      ),
    );

    const requiredFeeWithChange = spendHelper.calculateFee();

    if (excessAVAX > requiredFeeWithChange) {
      // It is worth adding the change output.
      spendHelper.addChangeOutput(
        new TransferableOutput(
          Id.fromString(context.avaxAssetID),
          new TransferOutput(
            new BigIntPr(excessAVAX - requiredFeeWithChange),
            ownerOverride,
          ),
        ),
      );
    }

    // Sorting happens in the .getInputsOutputs() method.
    return [null, spendHelper.getInputsOutputs()];
  } catch (error) {
    return [
      new Error('An unexpected error occurred during spend calculation', {
        cause: error instanceof Error ? error : undefined,
      }),
      null,
    ];
  }
};
