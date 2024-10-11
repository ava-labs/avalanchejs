import { jest } from '@jest/globals';

import { testContext } from '../../../fixtures/context';
import { Address, OutputOwners } from '../../../serializable';
import { defaultSpendOptions } from '../../common/defaultSpendOptions';
import { createDimensions } from '../../common/fees/dimensions';
import {
  verifyAssetsConsumed,
  type SpendReducerFunction,
  type SpendReducerState,
  handleFeeAndChange,
} from './spend-reducers';
import type { SpendProps } from './spend';
import { spend } from './spend';
import { feeState as testFeeState } from '../../../fixtures/pvm';

jest.mock('./spend-reducers', () => ({
  verifyAssetsConsumed: jest.fn<SpendReducerFunction>((state) => state),
  handleFeeAndChange: jest.fn<SpendReducerFunction>((state) => state),
}));

const CHANGE_ADDRESS = Address.fromString(
  'P-fuji1y50xa9363pn3d5gjhcz3ltp3fj6vq8x8a5txxg',
);
const CHANGE_OWNERS: OutputOwners = OutputOwners.fromNative([
  CHANGE_ADDRESS.toBytes(),
]);

const getSpendProps = (state: Partial<SpendReducerState> = {}): SpendProps => ({
  excessAVAX: 0n,
  initialComplexity: createDimensions({
    bandwidth: 1,
    dbRead: 1,
    dbWrite: 1,
    compute: 1,
  }),
  feeState: testFeeState(),
  fromAddresses: [CHANGE_ADDRESS],
  minIssuanceTime: BigInt(Math.floor(new Date().getTime() / 1000)),
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

describe('./src/vms/pvm/etna-builder/spend.test.ts', () => {
  // TODO: Enable.
  // Test is broken due to mocks not working. Needs investigation.
  test.skip('calls spend reducers', () => {
    const testReducer = jest.fn<SpendReducerFunction>((state) => state);

    spend(getSpendProps({ excessAVAX: 1_000n }), [testReducer], testContext);

    expect(testReducer).toHaveBeenCalledTimes(1);
    expect(verifyAssetsConsumed).toHaveBeenCalledTimes(1);
    expect(handleFeeAndChange).toHaveBeenCalledTimes(1);
  });

  test('catches thrown errors and re-throws', () => {
    const testReducer = jest.fn<SpendReducerFunction>(() => {
      throw new Error('Test error');
    });

    expect(() =>
      spend(getSpendProps({ excessAVAX: 1_000n }), [testReducer], testContext),
    ).toThrow('Test error');
  });

  test('catches thrown non-error and throws error', () => {
    const testReducer = jest.fn<SpendReducerFunction>(() => {
      throw 'not-an-error';
    });

    expect(() =>
      spend(getSpendProps({ excessAVAX: 1_000n }), [testReducer], testContext),
    ).toThrow('An unexpected error occurred during spend calculation');
  });

  test('change owners in state should default to change addresses', () => {
    expect.assertions(1);

    const initialState = getSpendProps({ excessAVAX: 1_000n });
    const testReducer = jest.fn<SpendReducerFunction>((state) => {
      expect(state.ownerOverride).toEqual(
        OutputOwners.fromNative(initialState.spendOptions.changeAddresses),
      );
      return state;
    });

    spend(initialState, [testReducer], testContext);
  });

  test('change owners in state should be ownerOverride if provided', () => {
    expect.assertions(1);

    const initialState = getSpendProps({
      excessAVAX: 1_000n,
      ownerOverride: CHANGE_OWNERS,
    });
    const testReducer = jest.fn<SpendReducerFunction>((state) => {
      expect(state.ownerOverride).toBe(CHANGE_OWNERS);
      return state;
    });

    spend(initialState, [testReducer], testContext);
  });
});
