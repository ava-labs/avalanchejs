import {
  transferableInput,
  transferableOutput,
  utxo,
} from '../../../fixtures/avax';
import { describe, test, expect } from 'vitest';

import { id } from '../../../fixtures/common';
import type { FeeState } from '../models';
import { stakeableLockOut, feeState } from '../../../fixtures/pvm';
import { TransferableOutput } from '../../../serializable';
import { isTransferOut } from '../../../utils';
import type { Dimensions } from '../../common/fees/dimensions';
import {
  addDimensions,
  createDimensions,
  dimensionsToGas,
} from '../../common/fees/dimensions';
import type { SpendHelperProps } from './spendHelper';
import { SpendHelper } from './spendHelper';
import { getInputComplexity, getOutputComplexity } from '../txs/fee';

const DEFAULT_GAS_PRICE = 3n;
const DEFAULT_FEE_STATE: FeeState = { ...feeState(), price: DEFAULT_GAS_PRICE };

const DEFAULT_WEIGHTS = createDimensions({
  bandwidth: 1,
  dbRead: 2,
  dbWrite: 3,
  compute: 4,
});

const DEFAULT_PROPS: SpendHelperProps = {
  changeOutputs: [],
  feeState: DEFAULT_FEE_STATE,
  initialComplexity: createDimensions({
    bandwidth: 1,
    dbRead: 1,
    dbWrite: 1,
    compute: 1,
  }),
  inputs: [],
  shouldConsolidateOutputs: false,
  stakeOutputs: [],
  toBurn: new Map<string, bigint>(),
  toStake: new Map<string, bigint>(),
  weights: DEFAULT_WEIGHTS,
};

const expectedFee = (...dimensions: Dimensions[]): bigint => {
  const totalDimensions = addDimensions(...dimensions);

  return dimensionsToGas(totalDimensions, DEFAULT_WEIGHTS) * DEFAULT_GAS_PRICE;
};

describe('src/vms/pvm/etna-builder/spendHelper', () => {
  test('initialized with correct values', () => {
    const spendHelper = new SpendHelper(DEFAULT_PROPS);

    expect(spendHelper).toBeInstanceOf(SpendHelper);

    const results = spendHelper.getInputsOutputs();

    expect(results.changeOutputs).toEqual([]);
    expect(results.fee).toBe(
      dimensionsToGas(DEFAULT_PROPS.initialComplexity, DEFAULT_WEIGHTS) *
        DEFAULT_GAS_PRICE,
    );
    expect(results.inputs).toEqual([]);
    expect(results.inputUTXOs).toEqual([]);
    expect(results.stakeOutputs).toEqual([]);
  });

  test('adding inputs and outputs', () => {
    const spendHelper = new SpendHelper(DEFAULT_PROPS);

    expect(spendHelper.getInputsOutputs()).toEqual({
      changeOutputs: [],
      fee: expectedFee(DEFAULT_PROPS.initialComplexity),
      inputs: [],
      inputUTXOs: [],
      stakeOutputs: [],
    });

    const inputUtxo = utxo();
    const inputTransferableInput = transferableInput();

    spendHelper.addInput(inputUtxo, inputTransferableInput);

    expect(spendHelper.getInputsOutputs()).toEqual({
      changeOutputs: [],
      fee: expectedFee(
        DEFAULT_PROPS.initialComplexity,
        getInputComplexity([inputTransferableInput]),
      ),
      inputs: [inputTransferableInput],
      inputUTXOs: [inputUtxo],
      stakeOutputs: [],
    });

    const changeOutput = transferableOutput();

    spendHelper.addChangeOutput(changeOutput);

    expect(spendHelper.getInputsOutputs()).toEqual({
      changeOutputs: [changeOutput],
      fee: expectedFee(
        DEFAULT_PROPS.initialComplexity,
        getInputComplexity([inputTransferableInput]),
        getOutputComplexity([changeOutput]),
      ),
      inputs: [inputTransferableInput],
      inputUTXOs: [inputUtxo],
      stakeOutputs: [],
    });

    const stakeOutput = transferableOutput();

    spendHelper.addStakedOutput(stakeOutput);

    expect(spendHelper.getInputsOutputs()).toEqual({
      changeOutputs: [changeOutput],
      fee: expectedFee(
        DEFAULT_PROPS.initialComplexity,
        getInputComplexity([inputTransferableInput]),
        getOutputComplexity([changeOutput, stakeOutput]),
      ),
      inputs: [inputTransferableInput],
      inputUTXOs: [inputUtxo],
      stakeOutputs: [stakeOutput],
    });
  });

  describe('SpendHelper.shouldConsumeLockedStakeableAsset', () => {
    test('returns false for asset not in toStake', () => {
      const spendHelper = new SpendHelper(DEFAULT_PROPS);

      expect(spendHelper.shouldConsumeLockedStakeableAsset('asset')).toBe(
        false,
      );
    });

    test('returns false for asset in toStake with 0 value', () => {
      const spendHelper = new SpendHelper({
        ...DEFAULT_PROPS,
        toStake: new Map([['asset', 0n]]),
      });

      expect(spendHelper.shouldConsumeLockedStakeableAsset('asset')).toBe(
        false,
      );
    });

    test('returns true for asset in toStake with non-0 value', () => {
      const spendHelper = new SpendHelper({
        ...DEFAULT_PROPS,
        toStake: new Map([['asset', 1n]]),
      });

      expect(spendHelper.shouldConsumeLockedStakeableAsset('asset')).toBe(true);
    });
  });

  describe('SpendHelper.shouldConsumeAsset', () => {
    test('returns false for asset not in toBurn', () => {
      const spendHelper = new SpendHelper(DEFAULT_PROPS);

      expect(spendHelper.shouldConsumeAsset('asset')).toBe(false);
    });

    test('returns false for asset in toBurn with 0 value', () => {
      const spendHelper = new SpendHelper({
        ...DEFAULT_PROPS,
        toBurn: new Map([['asset', 0n]]),
      });

      expect(spendHelper.shouldConsumeAsset('asset')).toBe(false);
    });

    test('returns true for asset in toBurn with non-0 value', () => {
      const spendHelper = new SpendHelper({
        ...DEFAULT_PROPS,
        toBurn: new Map([['asset', 1n]]),
      });

      expect(spendHelper.shouldConsumeAsset('asset')).toBe(true);
    });

    test('returns true for asset in toStake with non-0 value', () => {
      const spendHelper = new SpendHelper({
        ...DEFAULT_PROPS,
        toStake: new Map([['asset', 1n]]),
      });

      expect(spendHelper.shouldConsumeAsset('asset')).toBe(true);
    });

    test('returns false for asset in toStake with 0 value', () => {
      const spendHelper = new SpendHelper({
        ...DEFAULT_PROPS,
        toStake: new Map([['asset', 0n]]),
      });

      expect(spendHelper.shouldConsumeAsset('asset')).toBe(false);
    });
  });

  describe('SpendHelper.consumeLockedStakeableAsset', () => {
    const testCases = [
      {
        description: 'consumes the full amount',
        toStake: new Map([['asset', 1n]]),
        asset: 'asset',
        amount: 1n,
        expected: 0n,
      },
      {
        description: 'consumes a partial amount',
        toStake: new Map([['asset', 1n]]),
        asset: 'asset',
        amount: 2n,
        expected: 1n,
      },
      {
        description: 'consumes nothing',
        toStake: new Map([['asset', 1n]]),
        asset: 'asset',
        amount: 0n,
        expected: 0n,
      },
      {
        description: 'consumes nothing when asset not in toStake',
        toStake: new Map(),
        asset: 'asset',
        amount: 1n,
        expected: 1n,
      },
      {
        description: 'consumes nothing when asset in toStake with 0 value',
        toStake: new Map([['asset', 0n]]),
        asset: 'asset',
        amount: 1n,
        expected: 1n,
      },
    ];

    test.each(testCases)(
      '$description',
      ({ toStake, asset, amount, expected }) => {
        const spendHelper = new SpendHelper({
          ...DEFAULT_PROPS,
          toStake,
        });

        expect(spendHelper.consumeLockedStakableAsset(asset, amount)[0]).toBe(
          expected,
        );
      },
    );

    test('throws an error when amount is negative', () => {
      const spendHelper = new SpendHelper(DEFAULT_PROPS);

      expect(() => {
        spendHelper.consumeLockedStakableAsset('asset', -1n);
      }).toThrow('Amount to consume must be greater than or equal to 0');
    });
  });

  describe('SpendHelper.consumeAsset', () => {
    const testCases = [
      {
        description: 'consumes the full amount',
        toBurn: new Map([['asset', 1n]]),
        asset: 'asset',
        amount: 1n,
        expected: 0n,
      },
      {
        description: 'consumes a partial amount',
        toBurn: new Map([['asset', 1n]]),
        asset: 'asset',
        amount: 2n,
        expected: 1n,
      },
      {
        description: 'consumes nothing',
        toBurn: new Map([['asset', 1n]]),
        asset: 'asset',
        amount: 0n,
        expected: 0n,
      },
      {
        description: 'consumes nothing when asset not in toBurn',
        toBurn: new Map(),
        asset: 'asset',
        amount: 1n,
        expected: 1n,
      },
      {
        description: 'consumes nothing when asset in toBurn with 0 value',
        toBurn: new Map([['asset', 0n]]),
        asset: 'asset',
        amount: 1n,
        expected: 1n,
      },
      {
        description: 'consumes nothing when asset in toStake with 0 value',
        toBurn: new Map([['asset', 1n]]),
        toStake: new Map([['asset', 0n]]),
        asset: 'asset',
        amount: 1n,
        expected: 0n,
      },
    ];

    test.each(testCases)(
      '$description',
      ({ toBurn, asset, amount, expected }) => {
        const spendHelper = new SpendHelper({
          ...DEFAULT_PROPS,
          toBurn,
        });

        expect(spendHelper.consumeAsset(asset, amount)[0]).toBe(expected);
      },
    );

    test('throws an error when amount is negative', () => {
      const spendHelper = new SpendHelper(DEFAULT_PROPS);

      expect(() => {
        spendHelper.consumeAsset('asset', -1n);
      }).toThrow('Amount to consume must be greater than or equal to 0');
    });
  });

  describe('SpendHelper.verifyAssetsConsumed', () => {
    test('returns null when all assets consumed', () => {
      const spendHelper = new SpendHelper({
        ...DEFAULT_PROPS,
        toBurn: new Map([['asset', 0n]]),
        toStake: new Map([['asset', 0n]]),
      });

      expect(spendHelper.verifyAssetsConsumed()).toBe(null);
    });

    test('returns an error when stake assets not consumed', () => {
      const spendHelper = new SpendHelper({
        ...DEFAULT_PROPS,
        toBurn: new Map([['test-asset', 1n]]),
        toStake: new Map([['test-asset', 1n]]),
      });

      expect(spendHelper.verifyAssetsConsumed()).toEqual(
        new Error(
          'Insufficient funds! Provided UTXOs need 1 more units of asset test-asset to stake',
        ),
      );
    });

    test('returns an error when burn assets not consumed', () => {
      const spendHelper = new SpendHelper({
        ...DEFAULT_PROPS,
        toBurn: new Map([['test-asset', 1n]]),
        toStake: new Map([['test-asset', 0n]]),
      });

      expect(spendHelper.verifyAssetsConsumed()).toEqual(
        new Error(
          'Insufficient funds! Provided UTXOs need 1 more units of asset test-asset',
        ),
      );
    });
  });
  describe('SpendHelper.verifyGasUsage', () => {
    test('returns null when gas is under capacity', () => {
      const spendHelper = new SpendHelper({
        ...DEFAULT_PROPS,
      });

      const changeOutput = transferableOutput();

      spendHelper.addChangeOutput(changeOutput);

      expect(spendHelper.verifyGasUsage()).toBe(null);
    });

    test('returns an error when gas is over capacity', () => {
      const spendHelper = new SpendHelper({
        ...DEFAULT_PROPS,
        feeState: {
          ...DEFAULT_FEE_STATE,
          capacity: 0n,
        },
      });

      const changeOutput = transferableOutput();

      spendHelper.addChangeOutput(changeOutput);

      expect(spendHelper.verifyGasUsage()).toEqual(
        new Error('Gas usage of transaction (113) exceeds capacity (0)'),
      );
    });
  });

  test('no consolidated outputs when `shouldConsolidateOutputs` is `false`', () => {
    const spendHelper = new SpendHelper(DEFAULT_PROPS);

    spendHelper.addChangeOutput(transferableOutput());
    spendHelper.addChangeOutput(transferableOutput());

    const stakedTransferableOutput = new TransferableOutput(
      id(),
      stakeableLockOut(),
    );

    spendHelper.addStakedOutput(stakedTransferableOutput);
    spendHelper.addStakedOutput(stakedTransferableOutput);

    // Calculate fee to trigger potential consolidation.
    spendHelper.calculateFee();

    const result = spendHelper.getInputsOutputs();

    expect(result.changeOutputs).toHaveLength(2);
    expect(result.stakeOutputs).toHaveLength(2);
  });

  test('consolidating outputs when `shouldConsolidateOutputs` is `true`', () => {
    const spendHelper = new SpendHelper({
      ...DEFAULT_PROPS,
      shouldConsolidateOutputs: true,
    });

    spendHelper.addChangeOutput(transferableOutput());
    spendHelper.addChangeOutput(transferableOutput());

    const stakedTransferableOutput = new TransferableOutput(
      id(),
      stakeableLockOut(),
    );

    spendHelper.addStakedOutput(stakedTransferableOutput);
    spendHelper.addStakedOutput(stakedTransferableOutput);

    // Calculate fee to trigger potential consolidation.
    spendHelper.calculateFee();

    const result = spendHelper.getInputsOutputs();

    expect(result.changeOutputs).toHaveLength(1);
    expect(result.stakeOutputs).toHaveLength(1);
  });

  test('calculate fee with temporary output complexity', () => {
    const spendHelper = new SpendHelper(DEFAULT_PROPS);

    const originalFee = spendHelper.calculateFee();

    const temporaryOutput = transferableOutput();

    expect(spendHelper.calculateFee(temporaryOutput)).toBeGreaterThan(
      originalFee,
    );

    expect(spendHelper.calculateFee()).toBe(originalFee);
  });

  test('hasChangeOutput returns `true` when there is an AVAX change output', () => {
    const spendHelper = new SpendHelper(DEFAULT_PROPS);

    const changeOutput = transferableOutput();

    if (!isTransferOut(changeOutput.output)) {
      throw new Error('Output is not a TransferOutput');
    }

    const assetId = changeOutput.getAssetId();
    const outputOwners = changeOutput.output.outputOwners;

    expect(spendHelper.hasChangeOutput(assetId, outputOwners)).toBe(false);

    spendHelper.addChangeOutput(changeOutput);

    expect(spendHelper.hasChangeOutput(assetId, outputOwners)).toBe(true);

    expect(spendHelper.hasChangeOutput('other-asset', outputOwners)).toBe(
      false,
    );
  });
});
