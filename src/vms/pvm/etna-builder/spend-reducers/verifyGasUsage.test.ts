import { describe, expect, test, vi } from 'vitest';
import { testContext } from '../../../../fixtures/context';
import { getInitialReducerState, getSpendHelper } from './fixtures/reducers';
import { verifyGasUsage } from './verifyGasUsage';

describe('verifyGasUsage', () => {
  test('returns original state if gas is under the threshold', () => {
    const initialState = getInitialReducerState();
    const spendHelper = getSpendHelper();
    const spy = vi.spyOn(spendHelper, 'verifyGasUsage');

    const state = verifyGasUsage(initialState, spendHelper, testContext);

    expect(state).toBe(initialState);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('throws an error if gas is over the threshold', () => {
    const initialState = getInitialReducerState();
    const spendHelper = getSpendHelper();

    // Mock the verifyGasUsage method to throw an error
    // Testing for this function can be found in the spendHelper.test.ts file
    spendHelper.verifyGasUsage = vi.fn(() => {
      return new Error('Test error');
    });

    expect(() =>
      verifyGasUsage(initialState, spendHelper, testContext),
    ).toThrow('Test error');
  });
});
