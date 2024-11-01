import { testContext } from '../../../../fixtures/context';
import { describe, test, expect, it } from 'vitest';

import {
  getUsableUTXOsFilter,
  useSpendableLockedUTXOs,
} from './useSpendableLockedUTXOs';
import { getInitialReducerState, getSpendHelper } from './fixtures/reducers';
import {
  getLockedUTXO,
  getStakeableLockoutOutput,
  testAvaxAssetID,
  testOwnerXAddress,
  testUTXOID1,
  testUTXOID2,
} from '../../../../fixtures/transactions';
import {
  Address,
  BigIntPr,
  Id,
  Int,
  TransferableOutput,
} from '../../../../serializable';
import { Utxo } from '../../../../serializable/avax/utxo';
import {
  StakeableLockIn,
  StakeableLockOut,
} from '../../../../serializable/pvm';
import { IncorrectStakeableLockOutError } from './errors';
import { hexToBuffer } from '../../../../utils';
import { UTXOID } from '../../../../serializable/avax';
import { NoSigMatchError } from '../../../utils/calculateSpend/utils';

describe('useSpendableLockedUTXOs', () => {
  describe('getUsableUTXOsFilter', () => {
    test('returns `false` if UTXO output not a stakeable lockout', () => {
      expect(
        getUsableUTXOsFilter(getInitialReducerState())(getLockedUTXO()),
      ).toBe(false);
    });

    test('returns `false` if UTXO output is a stakeable lockout but locktime is greater than minIssuanceTime', () => {
      const state = getInitialReducerState({
        minIssuanceTime: 100n,
      });

      const utxo = getStakeableLockoutOutput(testUTXOID1, 50n, 200n);

      expect(getUsableUTXOsFilter(state)(utxo)).toBe(false);
    });

    test('returns `false` if UTXO output is a stakeable lockout with valid locktime but not used in toStake', () => {
      const state = getInitialReducerState({
        minIssuanceTime: 300n,
      });

      const utxo = getStakeableLockoutOutput(testUTXOID1, 50n, 100n);

      expect(getUsableUTXOsFilter(state)(utxo)).toBe(false);
    });

    test('returns `true` if UTXO output is a stakeable lockout with valid locktime and used in toStake', () => {
      const testAssetId = Id.fromString('testasset');

      const state = getInitialReducerState({
        minIssuanceTime: 100n,
        toStake: new Map([[testAssetId.toString(), 100n]]),
      });

      const utxo = getStakeableLockoutOutput(
        testUTXOID1,
        50n,
        300n,
        testAssetId,
      );

      expect(getUsableUTXOsFilter(state)(utxo)).toBe(true);
    });

    test('throws an error if UTXO output is a StakeableLockOut and the transferOut is not a TransferOutput', () => {
      const state = getInitialReducerState({
        minIssuanceTime: 100n,
      });

      const invalidUTXO = new Utxo(
        new UTXOID(testUTXOID2, new Int(0)),
        testAvaxAssetID,
        new StakeableLockOut(
          new BigIntPr(300n),
          new StakeableLockIn(
            new BigIntPr(2000000000n),
            TransferableOutput.fromNative(testAvaxAssetID.toString(), 20n, [
              hexToBuffer('0x12345678901234578901234567890123457890'),
            ]),
          ),
        ),
      );

      expect(() => getUsableUTXOsFilter(state)(invalidUTXO)).toThrow(
        IncorrectStakeableLockOutError,
      );
    });
  });

  it('should ignore UTXOs that signatures do not match', () => {
    const toBurn = new Map([[testContext.avaxAssetID, 4_900n]]);
    const toStake = new Map([[testContext.avaxAssetID, 4_900n]]);

    const initialState = getInitialReducerState({
      fromAddresses: [
        Address.fromString('P-fuji1y50xa9363pn3d5gjhcz3ltp3fj6vq8x8a5txxg'),
      ],
      excessAVAX: 0n,
      minIssuanceTime: 100n,
      toBurn,
      toStake,
      utxos: [getStakeableLockoutOutput(testUTXOID1, 10_000n, 300n)],
    });

    const spendHelper = getSpendHelper({ toBurn, toStake });

    expect(() =>
      useSpendableLockedUTXOs(initialState, spendHelper, testContext),
    ).toThrow(NoSigMatchError);
  });

  it('should do nothing if UTXO has no remaining amount to stake', () => {
    const toBurn = new Map();
    const toStake = new Map();

    const initialState = getInitialReducerState({
      excessAVAX: 0n,
      minIssuanceTime: 100n,
      toBurn,
      toStake,
      utxos: [getStakeableLockoutOutput(testUTXOID1, 10_000n, 300n)],
    });

    const spendHelper = getSpendHelper({ toBurn, toStake });
    const state = useSpendableLockedUTXOs(
      initialState,
      spendHelper,
      testContext,
    );
    const { changeOutputs, inputs, inputUTXOs, stakeOutputs } =
      spendHelper.getInputsOutputs();

    expect(state).toEqual(initialState);
    expect(changeOutputs).toHaveLength(0);
    expect(inputs).toHaveLength(0);
    expect(inputUTXOs).toHaveLength(0);
    expect(stakeOutputs).toHaveLength(0);
  });

  it('should add spendable locked UTXO with change', () => {
    const toBurn = new Map();
    const toStake = new Map([[testAvaxAssetID.toString(), 1_000n]]);

    const initialState = getInitialReducerState({
      fromAddresses: [testOwnerXAddress],
      excessAVAX: 0n,
      minIssuanceTime: 100n,
      toBurn,
      toStake,
      utxos: [
        getStakeableLockoutOutput(testUTXOID1, 10_000n, 300n, testAvaxAssetID),
      ],
    });

    const spendHelper = getSpendHelper({ toBurn, toStake });

    useSpendableLockedUTXOs(initialState, spendHelper, testContext);

    const { changeOutputs, inputs, inputUTXOs, stakeOutputs } =
      spendHelper.getInputsOutputs();

    expect(inputs).toHaveLength(1);
    expect(inputUTXOs).toHaveLength(1);
    expect(changeOutputs).toHaveLength(1);
    expect(stakeOutputs).toHaveLength(1);

    expect(stakeOutputs[0].amount()).toEqual(1_000n);
    expect(changeOutputs[0].amount()).toEqual(9_000n);
  });

  it('should add spendable locked UTXO without change', () => {
    const toBurn = new Map();
    const toStake = new Map([[testAvaxAssetID.toString(), 1_000n]]);

    const initialState = getInitialReducerState({
      fromAddresses: [testOwnerXAddress],
      excessAVAX: 0n,
      minIssuanceTime: 100n,
      toBurn,
      toStake,
      utxos: [
        getStakeableLockoutOutput(testUTXOID1, 1_000n, 300n, testAvaxAssetID),
      ],
    });

    const spendHelper = getSpendHelper({ toBurn, toStake });

    useSpendableLockedUTXOs(initialState, spendHelper, testContext);

    const { changeOutputs, inputs, inputUTXOs, stakeOutputs } =
      spendHelper.getInputsOutputs();

    expect(inputs).toHaveLength(1);
    expect(inputUTXOs).toHaveLength(1);
    expect(changeOutputs).toHaveLength(0);
    expect(stakeOutputs).toHaveLength(1);

    expect(stakeOutputs[0].amount()).toEqual(1_000n);
  });
});
