import { describe, expect, test, vi } from 'vitest';
import { testContext } from '../../../../fixtures/context';
import { getInitialReducerState, getSpendHelper } from './fixtures/reducers';
import { verifyGasUsage } from './verifyGasUsage';

describe('verifyGasUsage', () => {
  test('returns original state if gas is under the threshold', () => {
    const initialState = getInitialReducerState();
    const spendHelper = getSpendHelper();
    const spy = vi.spyOn(spendHelper, 'verifyAssetsConsumed');

    const state = verifyAssetsConsumed(initialState, spendHelper, testContext);

    expect(state).toBe(initialState);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('throws an error if gas is over the threshold', () => {
    const initialState = getInitialReducerState();
    const spendHelper = getSpendHelper();

    // Mock the verifyAssetsConsumed method to throw an error
    // Testing for this function can be found in the spendHelper.test.ts file
    spendHelper.verifyAssetsConsumed = vi.fn(() => {
      throw new Error('Test error');
    });

    expect(() =>
      verifyAssetsConsumed(initialState, spendHelper, testContext),
    ).toThrow('Test error');
  });
});
