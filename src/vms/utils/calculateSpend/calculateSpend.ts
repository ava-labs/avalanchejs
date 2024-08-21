import { TransferableInput } from '../../../serializable';
import type { Utxo } from '../../../serializable/avax/utxo';
import type { Address } from '../../../serializable/fxs/common';
import { AddressMaps } from '../../../utils/addressMap';
import { compareTransferableOutputs } from '../../../utils/sort';
import type { SpendOptionsRequired } from '../../common';
import type {
  UTXOCalculationFn,
  UTXOCalculationResult,
  UTXOCalculationState,
} from './models';

export const defaultSpendResult = (): UTXOCalculationResult => ({
  inputs: [],
  inputUTXOs: [],
  stakeOutputs: [],
  changeOutputs: [],
  addressMaps: new AddressMaps(),
});

/**
 * Make sure that the next state recieves a deep copy so that it cant mutate state. This is great if we need to
 * diagnose where something was changed. We can view state by state by putting logs between state cycles.
 *
 * @param state the state from previous action function
 * @returns UTXOCalculationResult
 */
function deepCopyState(state: UTXOCalculationState): UTXOCalculationState {
  return {
    ...state,
    amountsToBurn: new Map([...state.amountsToBurn]),
    amountsToStake: new Map([...state.amountsToStake]),
    inputs: [...state.inputs],
    inputUTXOs: [...state.inputUTXOs],
    stakeOutputs: [...state.stakeOutputs],
    changeOutputs: [...state.changeOutputs],
  };
}
/**
 * The idea here is a iterator style UTXO operator function system. Pass in the UTXOs and all of its operating functions. Each
 * function takes into account the state and performs its state changes. The next function is given a copy of the previous
 * and makes it updates. This way there is no mutations between functions but we can see from function to function what changes
 * were made if needed.
 *
 * In the very near future we can break the operator functions into much smaller chunks and have very precise operators instead of one
 * operator that deals with unlocked tokens for burn and stake and inputs all in one
 *
 * @param amountsToBurn
 * @param utxos
 * @param amountsToStake
 * @param fromAddresses
 * @param options
 * @param utxoParsers
 * @returns
 */
export function calculateUTXOSpend(
  amountsToBurn = new Map<string, bigint>(),
  amountsToStake = new Map<string, bigint>(),
  utxos: Utxo[],
  fromAddresses: Address[],
  options: SpendOptionsRequired,
  utxoCalculationFns: [UTXOCalculationFn, ...UTXOCalculationFn[]],
): UTXOCalculationResult {
  const startState: UTXOCalculationState = {
    amountsToBurn,
    utxos,
    amountsToStake,
    fromAddresses,
    options,
    ...defaultSpendResult(),
  };
  const result = (
    [
      ...utxoCalculationFns,
      function verifyAmountToBurnIsFulfilled({ amountsToBurn, ...state }) {
        amountsToBurn.forEach((amount, assetId) => {
          if (amount !== 0n) {
            throw new Error(
              `insufficient funds (Burn Amount): need ${amount} more units of ${assetId} to burn`,
            );
          }
        });

        return { amountsToBurn, ...state };
      },
      function verifyAmountToStateIsFulfilled({ amountsToStake, ...state }) {
        amountsToStake.forEach((amount, assetId) => {
          if (amount !== 0n) {
            throw new Error(
              `insufficient funds (Stake Amount): need ${amount} more units of ${assetId} to stake`,
            );
          }
        });

        return { amountsToStake, ...state };
      },
      function sortTransferableInputs({ inputs, ...state }) {
        inputs.sort(TransferableInput.compare);
        return { inputs, ...state };
      },
      function sortChangeOutputs({ changeOutputs, ...state }) {
        changeOutputs.sort(compareTransferableOutputs);
        return { changeOutputs, ...state };
      },
      function sortStakeOutputs({ stakeOutputs, ...state }) {
        stakeOutputs.sort(compareTransferableOutputs);
        return { stakeOutputs, ...state };
      },
      function getAddressMaps({ inputs, inputUTXOs, ...state }) {
        const addressMaps = AddressMaps.fromTransferableInputs(
          inputs,
          inputUTXOs,
          options.minIssuanceTime,
          fromAddresses.map((add) => add.toBytes()),
        );
        return { inputs, inputUTXOs, ...state, addressMaps };
      },
    ] satisfies UTXOCalculationFn[]
  ).reduce((state, next) => {
    // to prevent mutation we deep copy the arrays and maps before passing off to
    // the next operator
    return next(deepCopyState(state));
  }, startState);

  const calculationResult: UTXOCalculationResult = {
    inputs: result.inputs,
    inputUTXOs: result.inputUTXOs,
    stakeOutputs: result.stakeOutputs,
    changeOutputs: result.changeOutputs,
    addressMaps: result.addressMaps,
  };

  return calculationResult;
}
