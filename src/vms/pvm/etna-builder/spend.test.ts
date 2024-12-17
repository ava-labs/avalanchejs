import { describe, expect, test, vi } from 'vitest';
import { testContext } from '../../../fixtures/context';
import { Address, OutputOwners } from '../../../serializable';
import { createDimensions } from '../../common/fees/dimensions';
import {
  verifyAssetsConsumed,
  verifyGasUsage,
  type SpendReducerFunction,
  type SpendReducerState,
  handleFeeAndChange,
} from './spend-reducers';
import type { SpendProps } from './spend';
import { spend } from './spend';
import { feeState as testFeeState } from '../../../fixtures/pvm';
import { bech32ToBytes } from '../../../utils';

vi.mock('./spend-reducers', () => ({
  verifyGasUsage: vi.fn<SpendReducerFunction>((state) => state),
  verifyAssetsConsumed: vi.fn<SpendReducerFunction>((state) => state),
  handleFeeAndChange: vi.fn<SpendReducerFunction>((state) => state),
}));

const CHANGE_ADDRESS = Address.fromString(
  'P-fuji1y50xa9363pn3d5gjhcz3ltp3fj6vq8x8a5txxg',
);
const CHANGE_OWNERS: OutputOwners = OutputOwners.fromNative([
  CHANGE_ADDRESS.toBytes(),
]);

const getSpendProps = (state: Partial<SpendReducerState> = {}): SpendProps => ({
  changeOutputOwners: CHANGE_OWNERS,
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
  test('calls spend reducers', () => {
    const testReducer = vi.fn<SpendReducerFunction>((state) => state);

    spend(getSpendProps({ excessAVAX: 1_000n }), [testReducer], testContext);

    expect(testReducer).toHaveBeenCalledTimes(1);
    expect(verifyAssetsConsumed).toHaveBeenCalledTimes(1);
    expect(verifyGasUsage).toHaveBeenCalledTimes(1);
    expect(handleFeeAndChange).toHaveBeenCalledTimes(1);
  });

  test('catches thrown errors and re-throws', () => {
    const testReducer = vi.fn<SpendReducerFunction>(() => {
      throw new Error('Test error');
    });

    expect(() =>
      spend(getSpendProps({ excessAVAX: 1_000n }), [testReducer], testContext),
    ).toThrow('Test error');
  });

  test('catches thrown non-error and throws error', () => {
    const testReducer = vi.fn<SpendReducerFunction>(() => {
      throw 'not-an-error';
    });

    expect(() =>
      spend(getSpendProps({ excessAVAX: 1_000n }), [testReducer], testContext),
    ).toThrow('An unexpected error occurred during spend calculation');
  });

  test('change output owners in state should default to from addresses', () => {
    expect.assertions(1);

    const initialState = getSpendProps({ excessAVAX: 1_000n });
    const testReducer = vi.fn<SpendReducerFunction>((state) => {
      expect(state.changeOutputOwners).toEqual(
        OutputOwners.fromNative(
          initialState.fromAddresses.map((address) => address.toBytes()),
        ),
      );
      return state;
    });

    spend(initialState, [testReducer], testContext);
  });

  test('change output owners in state should be value provided', () => {
    expect.assertions(1);

    const changeAddressesBytes = [
      bech32ToBytes('P-fuji1t43hr35eu9enk7tfyqq4ukpww4stpzf74kxjfk'),
    ];

    const OWNERS = OutputOwners.fromNative(changeAddressesBytes);

    const initialState = getSpendProps({
      changeOutputOwners: OWNERS,
      excessAVAX: 1_000n,
    });
    const testReducer = vi.fn<SpendReducerFunction>((state) => {
      expect(state.changeOutputOwners).toBe(OWNERS);
      return state;
    });

    spend(initialState, [testReducer], testContext);
  });
});
