import type { OutputOwners, TransferableOutput } from '../../../serializable';
import { TransferableInput } from '../../../serializable';
import type { Utxo } from '../../../serializable/avax/utxo';
import { isTransferOut } from '../../../utils';
import { bigIntMin } from '../../../utils/bigintMath';
import { compareTransferableOutputs } from '../../../utils/sort';
import type { Dimensions } from '../../common/fees/dimensions';
import {
  addDimensions,
  createEmptyDimensions,
  dimensionsToGas,
} from '../../common/fees/dimensions';
import { consolidateOutputs } from '../../utils/consolidateOutputs';
import type { FeeState } from '../models';
import { getInputComplexity, getOutputComplexity } from '../txs/fee';

export interface SpendHelperProps {
  changeOutputs: readonly TransferableOutput[];
  feeState: FeeState;
  initialComplexity: Dimensions;
  inputs: readonly TransferableInput[];
  shouldConsolidateOutputs: boolean;
  stakeOutputs: readonly TransferableOutput[];
  toBurn: Map<string, bigint>;
  toStake: Map<string, bigint>;
  weights: Dimensions;
}

/**
 * The SpendHelper class assists in managing and processing the spending of assets,
 * including handling complexities, gas prices, and various outputs and inputs.
 *
 * @class
 */
export class SpendHelper {
  private readonly feeState: FeeState;
  private readonly initialComplexity: Dimensions;
  private readonly shouldConsolidateOutputs: boolean;
  private readonly toBurn: Map<string, bigint>;
  private readonly toStake: Map<string, bigint>;
  private readonly weights: Dimensions;

  private changeOutputs: readonly TransferableOutput[];
  private inputs: readonly TransferableInput[];
  private stakeOutputs: readonly TransferableOutput[];

  private inputUTXOs: readonly Utxo[] = [];

  constructor({
    changeOutputs,
    feeState,
    initialComplexity,
    inputs,
    shouldConsolidateOutputs,
    stakeOutputs,
    toBurn,
    toStake,
    weights,
  }: SpendHelperProps) {
    this.feeState = feeState;
    this.initialComplexity = initialComplexity;
    this.shouldConsolidateOutputs = shouldConsolidateOutputs;
    this.toBurn = toBurn;
    this.toStake = toStake;
    this.weights = weights;

    this.changeOutputs = changeOutputs;
    this.inputs = inputs;
    this.stakeOutputs = stakeOutputs;
  }

  /**
   * Adds an input UTXO and its corresponding transferable input to the SpendHelper.
   *
   * @param {Utxo} utxo - The UTXO to be added.
   * @param {TransferableInput} transferableInput - The transferable input corresponding to the UTXO.
   * @returns {SpendHelper} The current instance of SpendHelper for chaining.
   */
  addInput(utxo: Utxo, transferableInput: TransferableInput): SpendHelper {
    this.inputs = [...this.inputs, transferableInput];
    this.inputUTXOs = [...this.inputUTXOs, utxo];

    return this;
  }

  /**
   * Adds a change output to the SpendHelper.
   * Change outputs are outputs that are sent back to the sender.
   *
   * @param {TransferableOutput} transferableOutput - The change output to be added.
   * @returns {SpendHelper} The current instance of SpendHelper for chaining.
   */
  addChangeOutput(transferableOutput: TransferableOutput): SpendHelper {
    this.changeOutputs = [...this.changeOutputs, transferableOutput];

    return this;
  }

  /**
   * Adds a staked output to the SpendHelper.
   * Staked outputs are outputs that are staked by the sender.
   *
   * @param {TransferableOutput} transferableOutput - The staked output to be added.
   * @returns {SpendHelper} The current instance of SpendHelper for chaining.
   */
  addStakedOutput(transferableOutput: TransferableOutput): SpendHelper {
    this.stakeOutputs = [...this.stakeOutputs, transferableOutput];

    return this;
  }

  /**
   * When computing the complexity/fee of a transaction that needs change but doesn't yet have
   * a corresponding change output, `additionalComplexity` may be used to calculate the complexity
   * and therefore the fee as if the change output was already added.
   */
  private getComplexity(
    additionalComplexity: Dimensions = createEmptyDimensions(),
  ): Dimensions {
    return addDimensions(
      this.initialComplexity,
      getInputComplexity(this.inputs),
      getOutputComplexity(this.changeOutputs),
      getOutputComplexity(this.stakeOutputs),
      additionalComplexity,
    );
  }

  private consolidateOutputs(): void {
    if (this.shouldConsolidateOutputs) {
      this.changeOutputs = consolidateOutputs(this.changeOutputs);
      this.stakeOutputs = consolidateOutputs(this.stakeOutputs);
    }
  }

  /**
   * Determines if a locked stakeable asset should be consumed based on its asset ID.
   *
   * @param {string} assetId - The ID of the asset to check.
   * @returns {boolean} - Returns true if the asset should be consumed, false otherwise.
   */
  shouldConsumeLockedStakeableAsset(assetId: string): boolean {
    return this.toStake.has(assetId) && this.toStake.get(assetId) !== 0n;
  }

  /**
   * Determines if an asset should be consumed based on its asset ID.
   *
   * @param {string} assetId - The ID of the asset to check.
   * @returns {boolean} - Returns true if the asset should be consumed, false otherwise.
   */
  shouldConsumeAsset(assetId: string): boolean {
    return (
      (this.toBurn.has(assetId) && this.toBurn.get(assetId) !== 0n) ||
      this.shouldConsumeLockedStakeableAsset(assetId)
    );
  }

  /**
   * Consumes a locked stakeable asset based on its asset ID and amount.
   *
   * @param {string} assetId - The ID of the asset to consume.
   * @param {bigint} amount - The amount of the asset to consume.
   * @returns A tuple of the remaining amount in the first position and the amount to stake in the second position.
   */
  consumeLockedStakableAsset(
    assetId: string,
    amount: bigint,
  ): [remainingAmount: bigint, amountToStake: bigint] {
    if (amount < 0n) {
      throw new Error('Amount to consume must be greater than or equal to 0');
    }

    const remainingAmountToStake = this.toStake.get(assetId) ?? 0n;

    // Stake any value that should be staked
    const amountToStake = bigIntMin(
      // Amount we still need to stake
      remainingAmountToStake,
      // Amount available to stake
      amount,
    );

    this.toStake.set(assetId, remainingAmountToStake - amountToStake);

    return [amount - amountToStake, amountToStake];
  }

  /**
   * Consumes an asset based on its asset ID and amount.
   *
   * @param {string} assetId - The ID of the asset to consume.
   * @param {bigint} amount - The amount of the asset to consume.
   * @returns A tuple of the remaining amount in the first position and the amount to stake in the second position.
   */
  consumeAsset(
    assetId: string,
    amount: bigint,
  ): [remainingAmount: bigint, amountToStake: bigint] {
    if (amount < 0n) {
      throw new Error('Amount to consume must be greater than or equal to 0');
    }

    const remainingAmountToBurn = this.toBurn.get(assetId) ?? 0n;

    // Burn any value that should be burned
    const amountToBurn = bigIntMin(
      // Amount we still need to burn
      remainingAmountToBurn,
      // Amount available to burn
      amount,
    );

    this.toBurn.set(assetId, remainingAmountToBurn - amountToBurn);

    // Stake any remaining value that should be staked
    return this.consumeLockedStakableAsset(assetId, amount - amountToBurn);
  }

  /**
   * Calculates the gas usage for the SpendHelper based on its complexity and the weights.
   * Provide an empty change output as a parameter to calculate the fee as if the change output was already added.
   *
   * @param {TransferableOutput} additionalOutput - The change output that has not yet been added to the SpendHelper.
   * @returns {bigint} The gas usage for the SpendHelper.
   */
  private calculateGas(additionalOutput?: TransferableOutput): bigint {
    this.consolidateOutputs();

    const gas = dimensionsToGas(
      this.getComplexity(
        additionalOutput ? getOutputComplexity([additionalOutput]) : undefined,
      ),
      this.weights,
    );

    return gas;
  }

  /**
   * Calculates the fee for the SpendHelper based on its complexity and gas price.
   * Provide an empty change output as a parameter to calculate the fee as if the change output was already added.
   *
   * @param {TransferableOutput} additionalOutput - The change output that has not yet been added to the SpendHelper.
   * @returns {bigint} The fee for the SpendHelper.
   */
  calculateFee(additionalOutput?: TransferableOutput): bigint {
    const gas = this.calculateGas(additionalOutput);

    const gasPrice = this.feeState.price;

    return gas * gasPrice;
  }

  /**
   * Determines if a change output with a matching asset ID and output owners exists.
   *
   * @param assetId The asset ID to check
   * @param outputOwners The expected output owners on the asset ID
   * @returns {boolean} True if a change output with matching assetId and outputOwners exists, false otherwise
   */
  hasChangeOutput(assetId: string, outputOwners: OutputOwners): boolean {
    return this.changeOutputs.some(
      (transferableOutput) =>
        transferableOutput.assetId.value() === assetId &&
        isTransferOut(transferableOutput.output) &&
        transferableOutput.output.outputOwners.equals(outputOwners),
    );
  }

  /**
   * Verifies that all assets have been consumed.
   *
   * @returns {Error | null} An error if any assets have not been consumed, null otherwise.
   */
  verifyAssetsConsumed(): Error | null {
    for (const [assetId, amount] of this.toStake) {
      if (amount === 0n) {
        continue;
      }

      return new Error(
        `Insufficient funds! Provided UTXOs need ${amount} more units of asset ${assetId} to stake`,
      );
    }

    for (const [assetId, amount] of this.toBurn) {
      if (amount === 0n) {
        continue;
      }

      return new Error(
        `Insufficient funds! Provided UTXOs need ${amount} more units of asset ${assetId}`,
      );
    }

    return null;
  }

  /**
   * Verifies that gas usage does not exceed the fee state maximum.
   *
   * @returns {Error | null} An error if gas usage exceeds maximum, null otherwise.
   */
  verifyGasUsage(): Error | null {
    const gas = this.calculateGas();
    if (this.feeState.capacity < gas) {
      return new Error(
        `Gas usage of transaction (${gas.toString()}) exceeds capacity (${this.feeState.capacity.toString()})`,
      );
    }

    return null;
  }

  /**
   * Gets the inputs, outputs, and UTXOs for the SpendHelper.
   *
   * @returns {object} The inputs, outputs, and UTXOs for the SpendHelper
   */
  getInputsOutputs(): {
    changeOutputs: readonly TransferableOutput[];
    fee: bigint;
    inputs: readonly TransferableInput[];
    inputUTXOs: readonly Utxo[];
    stakeOutputs: readonly TransferableOutput[];
  } {
    const fee = this.calculateFee();

    const sortedInputs = [...this.inputs].sort(TransferableInput.compare);
    const sortedChangeOutputs = [...this.changeOutputs].sort(
      compareTransferableOutputs,
    );
    const sortedStakeOutputs = [...this.stakeOutputs].sort(
      compareTransferableOutputs,
    );

    return {
      changeOutputs: sortedChangeOutputs,
      fee,
      inputs: sortedInputs,
      inputUTXOs: this.inputUTXOs,
      stakeOutputs: sortedStakeOutputs,
    };
  }
}
