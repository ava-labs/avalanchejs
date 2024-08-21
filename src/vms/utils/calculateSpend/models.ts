import type { Utxo } from '../../../serializable/avax/utxo';
import type {
  TransferableOutput,
  TransferableInput,
} from '../../../serializable';
import type { Address } from '../../../serializable/fxs/common';
import type { SpendOptionsRequired } from '../../common';
import type { AddressMaps } from '../../../utils/addressMap';

export interface UTXOCalculationResult {
  inputs: TransferableInput[];
  inputUTXOs: Utxo[];
  stakeOutputs: TransferableOutput[];
  changeOutputs: TransferableOutput[];
  addressMaps: AddressMaps;
}

export interface UTXOCalculationState extends UTXOCalculationResult {
  amountsToBurn: Map<string, bigint>;
  utxos: Utxo[];
  fromAddresses: Address[];
  amountsToStake: Map<string, bigint>;
  options: SpendOptionsRequired;
}

export type UTXOCalculationFn = (
  values: UTXOCalculationState,
) => UTXOCalculationState;
