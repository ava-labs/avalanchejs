import type { Context } from '../../../context';
import type { SpendProps } from '../spend';
import type { SpendHelper } from '../spendHelper';

export type SpendReducerState = Readonly<
  Required<
    Omit<
      SpendProps,
      'changeAddressesBytes' | 'feeState' | 'shouldConsolidateOutputs'
    >
  > & {
    changeAddressesBytes: readonly Uint8Array[];
  }
>;

export type SpendReducerFunction = (
  state: SpendReducerState,
  spendHelper: SpendHelper,
  context: Context,
) => SpendReducerState;
