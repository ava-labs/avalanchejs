import { jest } from '@jest/globals';

import { testContext } from '../../../fixtures/context';
import { Address, OutputOwners } from '../../../serializable';
import { defaultSpendOptions } from '../../common/defaultSpendOptions';
import { createDimensions } from '../../common/fees/dimensions';
import type { SpendHelperProps } from './spendHelper';
import { SpendHelper } from './spendHelper';
import type { SpendReducerState } from './spend-reducers';
import { handleFeeAndChange } from './spend-reducers';

const CHANGE_ADDRESS = Address.fromString(
  'P-fuji1y50xa9363pn3d5gjhcz3ltp3fj6vq8x8a5txxg',
);
const CHANGE_OWNERS: OutputOwners = OutputOwners.fromNative([
  CHANGE_ADDRESS.toBytes(),
]);

const getInitialReducerState = (
  state: Partial<SpendReducerState> = {},
): SpendReducerState => ({
  excessAVAX: 0n,
  initialComplexity: createDimensions(1, 1, 1, 1),
  fromAddresses: [CHANGE_ADDRESS],
  ownerOverride: null,
  spendOptions: defaultSpendOptions(
    state?.fromAddresses?.map((address) => address.toBytes()) ?? [
      CHANGE_ADDRESS.toBytes(),
    ],
  ),
  toBurn: new Map(),
  toStake: new Map(),
  utxos: [],
  ...state,
});

const getSpendHelper = ({
  initialComplexity = createDimensions(1, 1, 1, 1),
  shouldConsolidateOutputs = false,
  toBurn = new Map(),
  toStake = new Map(),
}: Partial<
  Pick<
    SpendHelperProps,
    'initialComplexity' | 'shouldConsolidateOutputs' | 'toBurn' | 'toStake'
  >
> = {}) => {
  return new SpendHelper({
    changeOutputs: [],
    gasPrice: testContext.gasPrice,
    initialComplexity,
    inputs: [],
    shouldConsolidateOutputs,
    stakeOutputs: [],
    toBurn,
    toStake,
    weights: testContext.complexityWeights,
  });
};

describe('./src/vms/pvm/etna-builder/spend-reducers.test.ts', () => {
  describe('handleFeeAndChange', () => {
    test('throws an error if excessAVAX is less than the required fee', () => {
      expect(() =>
        handleFeeAndChange(
          getInitialReducerState(),
          getSpendHelper(),
          testContext,
        ),
      ).toThrow(
        `Insufficient funds: provided UTXOs need 4 more nAVAX (asset id: ${testContext.avaxAssetID})`,
      );
    });

    test('returns original state if excessAVAX equals the required fee', () => {
      const state = getInitialReducerState({ excessAVAX: 4n });
      const spendHelper = getSpendHelper();
      const addChangeOutputSpy = jest.spyOn(spendHelper, 'addChangeOutput');
      const calculateFeeWithTemporaryOutputComplexitySpy = jest.spyOn(
        spendHelper,
        'calculateFeeWithTemporaryOutputComplexity',
      );

      expect(handleFeeAndChange(state, getSpendHelper(), testContext)).toEqual(
        state,
      );
      expect(
        calculateFeeWithTemporaryOutputComplexitySpy,
      ).not.toHaveBeenCalled();
      expect(addChangeOutputSpy).not.toHaveBeenCalled();
    });

    test('adds a change output if excessAVAX is greater than the required fee', () => {
      const excessAVAX = 1_000n;
      const state = getInitialReducerState({
        excessAVAX,
      });
      const spendHelper = getSpendHelper();

      const addChangeOutputSpy = jest.spyOn(spendHelper, 'addChangeOutput');
      const calculateFeeWithTemporaryOutputComplexitySpy = jest.spyOn(
        spendHelper,
        'calculateFeeWithTemporaryOutputComplexity',
      );

      expect(handleFeeAndChange(state, spendHelper, testContext)).toEqual({
        ...state,
        excessAVAX,
      });
      expect(
        calculateFeeWithTemporaryOutputComplexitySpy,
      ).toHaveBeenCalledTimes(1);
      expect(addChangeOutputSpy).toHaveBeenCalledTimes(1);

      expect(
        spendHelper.hasChangeOutput(testContext.avaxAssetID, CHANGE_OWNERS),
      ).toBe(true);

      expect(spendHelper.getInputsOutputs().changeOutputs).toHaveLength(1);
    });

    test('does not add change output if fee with temporary output complexity and excessAVAX are equal or less', () => {
      const excessAVAX = 5n;
      const state = getInitialReducerState({
        excessAVAX,
      });
      const spendHelper = getSpendHelper();

      const addChangeOutputSpy = jest.spyOn(spendHelper, 'addChangeOutput');

      expect(handleFeeAndChange(state, spendHelper, testContext)).toEqual(
        state,
      );

      expect(addChangeOutputSpy).not.toHaveBeenCalled();
    });
  });
});
