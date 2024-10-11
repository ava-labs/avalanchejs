import { jest } from '@jest/globals';

import { testContext } from '../../../fixtures/context';
import { Address, OutputOwners } from '../../../serializable';
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
import { bech32ToBytes } from '../../../utils';

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
  changeOwnerOverride: null,
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

  test('change owners in state should default to from addresses', () => {
    expect.assertions(1);

    const initialState = getSpendProps({ excessAVAX: 1_000n });
    const testReducer = jest.fn<SpendReducerFunction>((state) => {
      expect(state.changeOwnerOverride).toEqual(
        OutputOwners.fromNative(
          initialState.fromAddresses.map((address) => address.toBytes()),
        ),
      );
      return state;
    });

    spend(initialState, [testReducer], testContext);
  });

  test('change owners in state should be change addresses', () => {
    expect.assertions(1);

    const changeAddressesBytes = [
      bech32ToBytes('P-fuji1t43hr35eu9enk7tfyqq4ukpww4stpzf74kxjfk'),
    ];

    const initialState = getSpendProps({
      changeAddressesBytes,
      excessAVAX: 1_000n,
    });
    const testReducer = jest.fn<SpendReducerFunction>((state) => {
      expect(state.changeOwnerOverride).toEqual(
        OutputOwners.fromNative(changeAddressesBytes),
      );
      return state;
    });

    spend(initialState, [testReducer], testContext);
  });

  test('change owners in state should be ownerOverride if provided', () => {
    expect.assertions(1);

    const changeAddressesBytes = [
      bech32ToBytes('P-fuji1t43hr35eu9enk7tfyqq4ukpww4stpzf74kxjfk'),
    ];

    const initialState = getSpendProps({
      changeAddressesBytes,
      changeOwnerOverride: CHANGE_OWNERS,
      excessAVAX: 1_000n,
    });
    const testReducer = jest.fn<SpendReducerFunction>((state) => {
      expect(state.changeOwnerOverride).toBe(CHANGE_OWNERS);
      return state;
    });

    spend(initialState, [testReducer], testContext);
  });
});
