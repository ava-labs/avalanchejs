import {
  BigIntPr,
  OutputOwners,
  TransferInput,
  TransferOutput,
  TransferableInput,
  TransferableOutput,
} from '../../../../serializable';
import type { Utxo } from '../../../../serializable/avax/utxo';
import type { StakeableLockOut } from '../../../../serializable/pvm';
import {
  getUtxoInfo,
  isStakeableLockOut,
  isTransferOut,
} from '../../../../utils';
import { verifySignaturesMatch } from '../../../utils/calculateSpend/utils';
import { IncorrectStakeableLockOutError } from './errors';
import type { SpendReducerFunction } from './types';

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
