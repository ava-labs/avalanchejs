import {
  transferableInput,
  transferableOutput,
  utxo,
} from '../../../fixtures/avax';
import { id } from '../../../fixtures/common';
import { stakeableLockOut } from '../../../fixtures/pvm';
import { TransferableOutput } from '../../../serializable';
import { isTransferOut } from '../../../utils';
import {
  createDimensions,
  dimensionsToGas,
} from '../../common/fees/dimensions';
import type { SpendHelperProps } from './spendHelper';
import { SpendHelper } from './spendHelper';

const DEFAULT_GAS_PRICE = 3n;

const DEFAULT_WEIGHTS = createDimensions(1, 2, 3, 4);

const DEFAULT_PROPS: SpendHelperProps = {
  changeOutputs: [],
  gasPrice: DEFAULT_GAS_PRICE,
  initialComplexity: createDimensions(1, 1, 1, 1),
  inputs: [],
  shouldConsolidateOutputs: false,
  stakeOutputs: [],
  toBurn: new Map<string, bigint>(),
  toStake: new Map<string, bigint>(),
  weights: DEFAULT_WEIGHTS,
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
      fee:
        dimensionsToGas(DEFAULT_PROPS.initialComplexity, DEFAULT_WEIGHTS) *
        DEFAULT_GAS_PRICE,
      inputs: [],
      inputUTXOs: [],
      stakeOutputs: [],
    });

    const inputUtxo = utxo();
    const inputTransferableInput = transferableInput();

    spendHelper.addInput(inputUtxo, inputTransferableInput);

    expect(spendHelper.getInputsOutputs()).toEqual({
      changeOutputs: [],
      fee: 942n,
      inputs: [inputTransferableInput],
      inputUTXOs: [inputUtxo],
      stakeOutputs: [],
    });

    const changeOutput = transferableOutput();

    spendHelper.addChangeOutput(changeOutput);

    expect(spendHelper.getInputsOutputs()).toEqual({
      changeOutputs: [changeOutput],
      fee: 1251n,
      inputs: [inputTransferableInput],
      inputUTXOs: [inputUtxo],
      stakeOutputs: [],
    });

    const stakeOutput = transferableOutput();

    spendHelper.addStakedOutput(stakeOutput);

    expect(spendHelper.getInputsOutputs()).toEqual({
      changeOutputs: [changeOutput],
      fee: 1560n,
      inputs: [inputTransferableInput],
      inputUTXOs: [inputUtxo],
      stakeOutputs: [stakeOutput],
    });
  });

  describe('SpendHelper.shouldConsumeLockedAsset', () => {
    test('returns false for asset not in toStake', () => {
      const spendHelper = new SpendHelper(DEFAULT_PROPS);

      expect(spendHelper.shouldConsumeLockedAsset('asset')).toBe(false);
    });

    test('returns false for asset in toStake with 0 value', () => {
      const spendHelper = new SpendHelper({
        ...DEFAULT_PROPS,
        toStake: new Map([['asset', 0n]]),
      });

      expect(spendHelper.shouldConsumeLockedAsset('asset')).toBe(false);
    });

    test('returns true for asset in toStake with non-0 value', () => {
      const spendHelper = new SpendHelper({
        ...DEFAULT_PROPS,
        toStake: new Map([['asset', 1n]]),
      });

      expect(spendHelper.shouldConsumeLockedAsset('asset')).toBe(true);
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

    describe('SpendHelper.consumeLockedAsset', () => {
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

          expect(spendHelper.consumeLockedAsset(asset, amount)).toBe(expected);
        },
      );

      test('throws an error when amount is negative', () => {
        const spendHelper = new SpendHelper(DEFAULT_PROPS);

        expect(() => {
          spendHelper.consumeLockedAsset('asset', -1n);
        }).toThrow('Amount to consume must be greater than or equal to 0');
      });
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

        expect(spendHelper.consumeAsset(asset, amount)).toBe(expected);
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
