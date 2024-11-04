import { testContext } from '../../../../fixtures/context';
import { describe, test, expect, it } from 'vitest';

import { getUsableUTXOsFilter, useUnlockedUTXOs } from './useUnlockedUTXOs';
import { getInitialReducerState, getSpendHelper } from './fixtures/reducers';
import {
  fromAddressBytes,
  getLockedUTXO,
  getNotTransferOutput,
  getStakeableLockoutOutput,
  getValidUtxo,
  testAvaxAssetID,
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
import { addressesFromBytes, hexToBuffer } from '../../../../utils';
import { UTXOID } from '../../../../serializable/avax';
import { NoSigMatchError } from '../../../utils/calculateSpend/utils';

describe('useUnlockedUTXOs', () => {
  describe('getUsableUTXOsFilter', () => {
    test('returns `true` if UTXO output is a TransferOutput and the locktime is less than the minIssuanceTime', () => {
      const state = getInitialReducerState({
        minIssuanceTime: 100n,
      });
      const utxo = getValidUtxo();
      expect(getUsableUTXOsFilter(state)(utxo)).toBe(true);
    });

    test('returns `false` if UTXO output is a TransferOutput and the locktime is equal or greater than the minIssuanceTime', () => {
      const state = getInitialReducerState({
        minIssuanceTime: 100n,
      });
      const utxo = getLockedUTXO(new BigIntPr(100n), 100n);
      expect(getUsableUTXOsFilter(state)(utxo)).toBe(false);
    });

    test('returns `true` if UTXO output is a StakeableLockOut and the locktime is less than the minIssuanceTime', () => {
      const state = getInitialReducerState({
        minIssuanceTime: 100n,
      });

      const utxo = getStakeableLockoutOutput(testUTXOID1, 100n, 50n);

      expect(getUsableUTXOsFilter(state)(utxo)).toBe(true);
    });

    test('returns `false` if UTXO output is a StakeableLockOut and the locktime is equal or greater than the minIssuanceTime', () => {
      const state = getInitialReducerState({
        minIssuanceTime: 100n,
      });

      const utxo = getStakeableLockoutOutput(testUTXOID1, 100n, 100n);

      expect(getUsableUTXOsFilter(state)(utxo)).toBe(false);
    });

    test('throws an error if UTXO output is a StakeableLockOut and the transferOut is not a TransferOutput', () => {
      const state = getInitialReducerState({
        minIssuanceTime: 100n,
      });

      const invalidUTXO = new Utxo(
        new UTXOID(testUTXOID2, new Int(0)),
        testAvaxAssetID,
        new StakeableLockOut(
          new BigIntPr(50n),
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

    test('returns `false` if UTXO output is not a TransferOutput or a StakeableLockOut', () => {
      expect(
        getUsableUTXOsFilter(getInitialReducerState())(getNotTransferOutput()),
      ).toBe(false);
    });
  });

  it('should handle verified usable AVAX UTXOs', () => {
    const toBurn = new Map([[testContext.avaxAssetID, 4_900n]]);
    const toStake = new Map([[testContext.avaxAssetID, 4_900n]]);

    const initialState = getInitialReducerState({
      fromAddresses: addressesFromBytes(fromAddressBytes),
      excessAVAX: 0n,
      toBurn,
      toStake,
      utxos: [getValidUtxo(new BigIntPr(10_000n))],
    });

    const spendHelper = getSpendHelper({ toBurn, toStake });

    const state = useUnlockedUTXOs(initialState, spendHelper, testContext);
    const { inputs } = spendHelper.getInputsOutputs();

    expect(state.excessAVAX).toEqual(10_000n - 4_900n - 4_900n);
    expect(inputs).toHaveLength(1);
    expect(inputs[0].getAssetId()).toEqual(testContext.avaxAssetID);
  });

  it('should skip other verified usable UTXOs with no toBurn or toStake match', () => {
    const toBurn = new Map([[testContext.avaxAssetID, 4_900n]]);
    const toStake = new Map([[testContext.avaxAssetID, 4_900n]]);

    const initialState = getInitialReducerState({
      fromAddresses: addressesFromBytes(fromAddressBytes),
      excessAVAX: 0n,
      toBurn,
      toStake,
      utxos: [
        getValidUtxo(new BigIntPr(10_000n)),
        getValidUtxo(new BigIntPr(5_000n), Id.fromString('testasset')),
      ],
    });

    const spendHelper = getSpendHelper({ toBurn, toStake });

    useUnlockedUTXOs(initialState, spendHelper, testContext);
    const { inputs, inputUTXOs } = spendHelper.getInputsOutputs();

    // Should only be the AVAX UTXO
    expect(inputUTXOs).toHaveLength(1);
    expect(inputs).toHaveLength(1);
    expect(inputs[0].getAssetId()).not.toEqual('testasset');
  });

  it('should consume other verified usable UTXOs with a toBurn or toStake match', () => {
    const testAssetId = Id.fromString('testasset');
    const testAssetId2 = Id.fromString('testasset2');
    const toBurn = new Map([
      [testContext.avaxAssetID, 4_900n],
      [testAssetId.toString(), 1_900n],
      [testAssetId2.toString(), 100n],
    ]);
    const toStake = new Map([
      [testContext.avaxAssetID, 4_900n],
      [testAssetId.toString(), 1_900n],
    ]);

    const initialState = getInitialReducerState({
      fromAddresses: addressesFromBytes(fromAddressBytes),
      excessAVAX: 0n,
      toBurn,
      toStake,
      utxos: [
        getValidUtxo(new BigIntPr(10_000n)),
        getValidUtxo(new BigIntPr(5_000n), testAssetId),
        getValidUtxo(new BigIntPr(100n), testAssetId2),
      ],
    });

    const spendHelper = getSpendHelper({ toBurn, toStake });

    useUnlockedUTXOs(initialState, spendHelper, testContext);
    const { changeOutputs, inputs, inputUTXOs } =
      spendHelper.getInputsOutputs();

    expect(inputUTXOs).toHaveLength(3);
    expect(inputs).toHaveLength(3);

    // Only expect 1 for now. The AVAX UTXOs aren't added as part of this reducer.
    // Only testAssetId is given back change. testAssetId2 is consumed fully with no change.
    expect(changeOutputs).toHaveLength(1);

    expect(changeOutputs[0].amount()).toEqual(5_000n - 1_900n - 1_900n);
  });

  it('should ignore UTXOs that signatures do not match', () => {
    const toBurn = new Map([[testContext.avaxAssetID, 4_900n]]);
    const toStake = new Map([[testContext.avaxAssetID, 4_900n]]);

    const initialState = getInitialReducerState({
      fromAddresses: [
        Address.fromString('P-fuji1y50xa9363pn3d5gjhcz3ltp3fj6vq8x8a5txxg'),
      ],
      excessAVAX: 0n,
      toBurn,
      toStake,
      utxos: [getValidUtxo(new BigIntPr(10_000n))],
    });

    const spendHelper = getSpendHelper({ toBurn, toStake });

    expect(() =>
      useUnlockedUTXOs(initialState, spendHelper, testContext),
    ).toThrow(NoSigMatchError);
  });
});
