import type {
  Address,
  TransferableInput,
  TransferableOutput,
} from '../../../serializable';
import { OutputOwners } from '../../../serializable';
import type { Utxo } from '../../../serializable/avax/utxo';
import type { Dimensions } from '../../common/fees/dimensions';
import type { Context } from '../../context';
import type { FeeState } from '../models';
import type { SpendReducerFunction, SpendReducerState } from './spend-reducers';
import {
  handleFeeAndChange,
  verifyAssetsConsumed,
  verifyGasUsage,
} from './spend-reducers';
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
   * Output owners for the change outputs.
   */
  changeOutputOwners: OutputOwners;
  /**
   * The extra AVAX that spend can produce in
   * the change outputs in addition to the consumed and not burned AVAX.
   */
  excessAVAX?: bigint;
  feeState: FeeState;
  /**
   * List of Addresses that are used for selecting which UTXOs are signable.
   */
  fromAddresses: readonly Address[];
  /**
   * The initial complexity of the transaction.
   */
  initialComplexity: Dimensions;
  minIssuanceTime: bigint;
  /**
   * Whether to consolidate change and stake outputs.
   *
   * @default false
   */
  shouldConsolidateOutputs?: boolean;
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

/**
 * Processes the spending of assets, including burning and staking, from a list of UTXOs.
 *
 * @param {SpendProps} props - The properties required to execute the spend operation.
 * @param {SpendReducerFunction[]} spendReducers - The list of functions that will be executed to process the spend operation.
 * @param {Context} context - The context in which the spend operation is executed.
 *
 * @returns {SpendResult} - A tuple where the first element is either null or an error,
 * and the second element is either the result of the spend operation or null.
 *
 * @throws {Error} - Thrown error or an unexpected error if is not an instance of Error.
 */
export const spend = (
  {
    changeOutputOwners,
    excessAVAX = 0n,
    feeState,
    fromAddresses,
    initialComplexity,
    minIssuanceTime,
    shouldConsolidateOutputs = false,
    toBurn = new Map(),
    toStake = new Map(),
    utxos,
  }: SpendProps,
  spendReducers: readonly SpendReducerFunction[],
  context: Context,
): SpendResult => {
  try {
    const changeOwners =
      changeOutputOwners ||
      OutputOwners.fromNative(
        fromAddresses.map((address) => address.toBytes()),
      );

    const spendHelper = new SpendHelper({
      changeOutputs: [],
      feeState,
      initialComplexity,
      inputs: [],
      shouldConsolidateOutputs,
      stakeOutputs: [],
      toBurn,
      toStake,
      weights: context.platformFeeConfig.weights,
    });

    const initialState: SpendReducerState = {
      changeOutputOwners: changeOwners,
      excessAVAX,
      initialComplexity,
      fromAddresses,
      minIssuanceTime,
      toBurn,
      toStake,
      utxos,
    };

    const spendReducerFunctions: readonly SpendReducerFunction[] = [
      ...spendReducers,
      verifyAssetsConsumed,
      handleFeeAndChange,
      verifyGasUsage, // This should happen after change is added
      // Consolidation and sorting happens in the SpendHelper.
    ];

    // Run all the spend calculation reducer logic.
    spendReducerFunctions.reduce((state, reducer) => {
      return reducer(state, spendHelper, context);
    }, initialState);

    return spendHelper.getInputsOutputs();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('An unexpected error occurred during spend calculation');
  }
};
