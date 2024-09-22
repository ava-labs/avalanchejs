import { jest } from '@jest/globals';

import { testContext } from '../../../../fixtures/context';
import { handleFeeAndChange } from './handleFeeAndChange';
import {
  CHANGE_OWNERS,
  getInitialReducerState,
  getSpendHelper,
} from './fixtures/reducers';

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
    expect(calculateFeeWithTemporaryOutputComplexitySpy).not.toHaveBeenCalled();
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
    expect(calculateFeeWithTemporaryOutputComplexitySpy).toHaveBeenCalledTimes(
      1,
    );
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

    expect(handleFeeAndChange(state, spendHelper, testContext)).toEqual(state);

    expect(addChangeOutputSpy).not.toHaveBeenCalled();
  });
});
