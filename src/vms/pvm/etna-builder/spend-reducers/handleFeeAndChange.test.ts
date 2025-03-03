import { describe, expect, test, vi } from 'vitest';
import { testContext } from '../../../../fixtures/context';
import { handleFeeAndChange } from './handleFeeAndChange';
import {
  CHANGE_OWNERS,
  getInitialReducerState,
  getSpendHelper,
} from './fixtures/reducers';
import {
  BigIntPr,
  Id,
  TransferOutput,
  TransferableOutput,
} from '../../../../serializable';

describe('handleFeeAndChange', () => {
  test('throws an error if excessAVAX is less than the required fee', () => {
    expect(() =>
      handleFeeAndChange(
        getInitialReducerState(),
        getSpendHelper(),
        testContext,
      ),
    ).toThrow(
      `Insufficient funds: provided UTXOs need 4 more unlocked nAVAX (asset id: ${testContext.avaxAssetID}) to cover fee.`,
    );
  });

  test('returns original state if excessAVAX equals the required fee', () => {
    const state = getInitialReducerState({ excessAVAX: 4n });
    const spendHelper = getSpendHelper();
    const addChangeOutputSpy = vi.spyOn(spendHelper, 'addChangeOutput');
    const calculateFeeSpy = vi.spyOn(spendHelper, 'calculateFee');

    expect(handleFeeAndChange(state, spendHelper, testContext)).toEqual(state);
    expect(calculateFeeSpy).toHaveBeenCalledTimes(1);
    expect(calculateFeeSpy).toHaveBeenCalledWith();
    expect(addChangeOutputSpy).not.toHaveBeenCalled();
  });

  test('adds a change output if excessAVAX is greater than the required fee', () => {
    const excessAVAX = 1_000n;
    const state = getInitialReducerState({
      excessAVAX,
    });
    const spendHelper = getSpendHelper();

    const addChangeOutputSpy = vi.spyOn(spendHelper, 'addChangeOutput');
    const calculateFeeSpy = vi.spyOn(spendHelper, 'calculateFee');

    expect(handleFeeAndChange(state, spendHelper, testContext)).toEqual({
      ...state,
      excessAVAX,
    });
    expect(calculateFeeSpy).toHaveBeenCalledTimes(2);
    expect(calculateFeeSpy).toHaveBeenCalledWith(
      new TransferableOutput(
        Id.fromString(testContext.avaxAssetID),
        new TransferOutput(new BigIntPr(0n), CHANGE_OWNERS),
      ),
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

    const addChangeOutputSpy = vi.spyOn(spendHelper, 'addChangeOutput');

    expect(handleFeeAndChange(state, spendHelper, testContext)).toEqual(state);

    expect(addChangeOutputSpy).not.toHaveBeenCalled();
  });
});
