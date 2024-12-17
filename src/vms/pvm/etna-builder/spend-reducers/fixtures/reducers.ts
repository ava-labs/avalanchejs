import { testContext } from '../../../../../fixtures/context';
import { feeState as testFeeState } from '../../../../../fixtures/pvm';
import { Address, OutputOwners } from '../../../../../serializable';
import { createDimensions } from '../../../../common/fees/dimensions';
import type { FeeState } from '../../../models';
import type { SpendHelperProps } from '../../spendHelper';
import { SpendHelper } from '../../spendHelper';
import type { SpendReducerState } from '../types';

export const CHANGE_ADDRESS = Address.fromString(
  'P-fuji1y50xa9363pn3d5gjhcz3ltp3fj6vq8x8a5txxg',
);
export const CHANGE_OWNERS: OutputOwners = OutputOwners.fromNative([
  CHANGE_ADDRESS.toBytes(),
]);

export const getInitialReducerState = ({
  ...state
}: Partial<SpendReducerState> = {}): SpendReducerState => ({
  changeOutputOwners: CHANGE_OWNERS,
  excessAVAX: 0n,
  initialComplexity: createDimensions({
    bandwidth: 1,
    dbRead: 1,
    dbWrite: 1,
    compute: 1,
  }),
  fromAddresses: [CHANGE_ADDRESS],
  minIssuanceTime: BigInt(Math.floor(new Date().getTime() / 1000)),
  toBurn: new Map(),
  toStake: new Map(),
  utxos: [],
  ...state,
});

export const getSpendHelper = ({
  feeState = testFeeState(),
  initialComplexity = createDimensions({
    bandwidth: 1,
    dbRead: 1,
    dbWrite: 1,
    compute: 1,
  }),
  shouldConsolidateOutputs = false,
  toBurn = new Map(),
  toStake = new Map(),
}: Partial<
  Pick<
    SpendHelperProps,
    'initialComplexity' | 'shouldConsolidateOutputs' | 'toBurn' | 'toStake'
  > & { feeState: FeeState }
> = {}) => {
  return new SpendHelper({
    changeOutputs: [],
    feeState,
    initialComplexity,
    inputs: [],
    shouldConsolidateOutputs,
    stakeOutputs: [],
    toBurn,
    toStake,
    weights: testContext.platformFeeConfig.weights,
  });
};
