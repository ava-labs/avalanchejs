import { consolidateOutputs } from '../../utils/consolidateOutputs';
import type { UTXOCalculationState } from '../../utils/calculateSpend';

export function useConsolidateOutputs({
  changeOutputs,
  stakeOutputs,
  ...state
}: UTXOCalculationState): UTXOCalculationState {
  const consolidatedChangeOutputs = consolidateOutputs(changeOutputs);
  const consolidatedStakeOutputs = consolidateOutputs(stakeOutputs);

  return {
    ...state,
    changeOutputs: consolidatedChangeOutputs,
    stakeOutputs: consolidatedStakeOutputs,
  };
}
