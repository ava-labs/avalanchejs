// This file is being used in test files to help figure out the fees.

import type {
  TransferableInput,
  TransferableOutput,
} from '../../../../serializable';
import type { UnsignedTx } from '../../../common';
import { calculateFee } from '../../txs/fee/calculator';
import type { FeeState } from '../../models';
import { testContext } from '../../../../fixtures/context';
import { testAvaxAssetID } from '../../../../fixtures/transactions';
const addTransferableAmounts = (
  transferableItems:
    | readonly TransferableOutput[]
    | readonly TransferableInput[],
): Map<string, bigint> => {
  const amounts = new Map<string, bigint>();

  for (const transferable of transferableItems) {
    const assetId = transferable.getAssetId();

    amounts.set(assetId, (amounts.get(assetId) ?? 0n) + transferable.amount());
  }

  return amounts;
};

const addAmounts = (...amounts: Map<string, bigint>[]): Map<string, bigint> => {
  const amount = new Map<string, bigint>();

  for (const m of amounts) {
    for (const [assetID, value] of m) {
      amount.set(assetID, (amount.get(assetID) ?? 0n) + value);
    }
  }

  return amount;
};
/**
 * Given a bigint, returns a human-readable string of the value.
 *
 * @example
 * ```ts
 * formatBigIntToHumanReadable(123456789n); // '123_456_789n'
 * formatBigIntToHumanReadable(1234567890n); // '1_234_567_890n'
 * ```
 */
const formatBigIntToHumanReadable = (value: bigint): string => {
  const bigIntStr = value.toString();

  return `${bigIntStr.replace(/\B(?=(\d{3})+(?!\d))/g, '_')}n`;
};

/**
 * Calculates the required fee for the unsigned transaction
 * and verifies that the burned amount is exactly the required fee.
 */
export const checkFeeIsCorrect = ({
  unsignedTx,
  inputs,
  outputs,
  feeState,
  additionalInputs = [],
  additionalOutputs = [],
  additionalFee = 0n,
}: {
  unsignedTx: UnsignedTx;
  inputs: readonly TransferableInput[];
  outputs: readonly TransferableOutput[];
  feeState: FeeState;
  additionalInputs?: readonly TransferableInput[];
  additionalOutputs?: readonly TransferableOutput[];
  additionalFee?: bigint;
}): [
  amountConsumed: Record<string, string>,
  expectedAmountConsumed: Record<string, string>,
  expectedFee: bigint,
] => {
  const amountConsumed = addTransferableAmounts([
    ...inputs,
    ...additionalInputs,
  ]);
  const amountProduced = addTransferableAmounts([
    ...outputs,
    ...additionalOutputs,
  ]);

  const expectedFee = calculateFee(
    unsignedTx.getTx(),
    testContext.platformFeeConfig.weights,
    feeState.price,
  );

  const expectedAmountBurned = addAmounts(
    new Map([[testAvaxAssetID.toString(), expectedFee + additionalFee]]),
  );

  const expectedAmountConsumed = addAmounts(
    amountProduced,
    expectedAmountBurned,
  );

  // Convert each map into a object with a stringified bigint value.
  const safeExpectedAmountConsumed = Object.fromEntries(
    [...expectedAmountConsumed].map(([k, v]) => [
      k,
      formatBigIntToHumanReadable(v),
    ]),
  );

  const safeAmountConsumed = Object.fromEntries(
    [...amountConsumed].map(([k, v]) => [k, formatBigIntToHumanReadable(v)]),
  );

  return [
    safeAmountConsumed,
    safeExpectedAmountConsumed,
    expectedFee + additionalFee,
  ];
};
