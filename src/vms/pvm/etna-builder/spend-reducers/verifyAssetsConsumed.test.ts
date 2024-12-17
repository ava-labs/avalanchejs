import { describe, expect, test, vi } from 'vitest';
import { testContext } from '../../../../fixtures/context';
import { getInitialReducerState, getSpendHelper } from './fixtures/reducers';
import { verifyAssetsConsumed } from './verifyAssetsConsumed';

describe('verifyAssetsConsumed', () => {
  test('returns original state if all assets are consumed', () => {
    const initialState = getInitialReducerState();
    const spendHelper = getSpendHelper();
    const spy = vi.spyOn(spendHelper, 'verifyAssetsConsumed');

    const state = verifyAssetsConsumed(initialState, spendHelper, testContext);

    expect(state).toBe(initialState);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('throws an error if some assets are not consumed', () => {
    const initialState = getInitialReducerState();
    const spendHelper = getSpendHelper();

    // Mock the verifyAssetsConsumed method to throw an error
    // Testing for this function can be found in the spendHelper.test.ts file
    spendHelper.verifyAssetsConsumed = vi.fn(() => {
      return new Error('Test error');
    });

    expect(() =>
      verifyAssetsConsumed(initialState, spendHelper, testContext),
    ).toThrow('Test error');
  });
});
