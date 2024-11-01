import { Id } from '../../../serializable/fxs/common';
import { describe, it, expect } from 'vitest';

import { testContext } from '../../../fixtures/context';
import {
  fromAddressBytes,
  testUTXOID1,
  getStakeableLockoutOutput,
  testUTXOID2,
} from '../../../fixtures/transactions';
import { addressesFromBytes } from '../../../utils';
import { useSpendableLockedUTXOs } from './useSpendableLockedUTXOs';
import { defaultSpendResult } from '../../utils/calculateSpend';
import type { StakeableLockOut } from '../../../serializable/pvm';

describe('src/vms/pvm/spend/useSpendableLockedUTXOs.spec.ts', () => {
  it('Should do nothing if stakeable output is not locked anymore', () => {
    const stakeableUtxoAmt1 = 600000000n;
    const stakeableUtxoAmt2 = 700000000n;
    const amountRemainingToStake = 500000000n;
    const lockTime = 1n;

    const { amountsToStake, changeOutputs, inputs } = useSpendableLockedUTXOs({
      amountsToBurn: new Map(),
      ...defaultSpendResult(),
      utxos: [
        getStakeableLockoutOutput(testUTXOID1, stakeableUtxoAmt1, lockTime),
        getStakeableLockoutOutput(testUTXOID2, stakeableUtxoAmt2, lockTime),
      ],
      fromAddresses: addressesFromBytes(fromAddressBytes),
      amountsToStake: new Map([
        [testContext.avaxAssetID, amountRemainingToStake],
      ]), // amount remaining to stake
      options: { minIssuanceTime: lockTime * 2n } as any,
    });

    expect(changeOutputs.length).toEqual(0);
    expect(inputs.length).toEqual(0);
    expect(amountsToStake.get(testContext.avaxAssetID)).toEqual(
      amountRemainingToStake,
    );
  });

  it('Should have a remaining stakeable amount and has no change', () => {
    const stakeableUtxoAmt1 = 200000000n;
    const stakeableUtxoAmt2 = 100000000n;
    const amountRemainingToStake = 500000000n;

    const { amountsToStake, changeOutputs } = useSpendableLockedUTXOs({
      amountsToBurn: new Map(),
      ...defaultSpendResult(),
      utxos: [
        getStakeableLockoutOutput(testUTXOID1, stakeableUtxoAmt1),
        getStakeableLockoutOutput(testUTXOID2, stakeableUtxoAmt2),
      ],
      fromAddresses: addressesFromBytes(fromAddressBytes),
      amountsToStake: new Map([
        [testContext.avaxAssetID, amountRemainingToStake],
      ]), // amount remaining to stake
      options: { minIssuanceTime: 0n } as any,
    });

    expect(changeOutputs.length).toEqual(0);
    expect(amountsToStake.get(testContext.avaxAssetID)).toEqual(
      amountRemainingToStake - stakeableUtxoAmt1 - stakeableUtxoAmt2,
    );
  });

  it('Should have no remaining stakeable amount and change', () => {
    const stakeableUtxoAmt1 = 200000000n;
    const stakeableUtxoAmt2 = 400000000n;
    const amountRemainingToStake = 500000000n;

    const { amountsToStake, changeOutputs, inputs, inputUTXOs } =
      useSpendableLockedUTXOs({
        amountsToBurn: new Map(),
        ...defaultSpendResult(),
        utxos: [
          getStakeableLockoutOutput(testUTXOID1, stakeableUtxoAmt1),
          getStakeableLockoutOutput(testUTXOID2, stakeableUtxoAmt2),
        ],
        fromAddresses: addressesFromBytes(fromAddressBytes),
        amountsToStake: new Map([
          [testContext.avaxAssetID, amountRemainingToStake],
        ]), // amount remaining to stake
        options: { minIssuanceTime: 0 } as any,
      });

    expect(changeOutputs.length).toEqual(1);
    expect(changeOutputs[0].amount()).toEqual(
      stakeableUtxoAmt1 + stakeableUtxoAmt2 - amountRemainingToStake,
    );
    expect(amountsToStake.get(testContext.avaxAssetID)).toEqual(0n);

    expect(inputs).toHaveLength(2);
    expect(inputs[0].utxoID.txID).toEqual(testUTXOID1);
    expect(inputs[0].amount()).toEqual(stakeableUtxoAmt1);
    expect(inputs[1].utxoID.txID).toEqual(testUTXOID2);
    expect(inputs[1].amount()).toEqual(stakeableUtxoAmt2);

    expect(inputUTXOs).toHaveLength(2);
    expect(inputUTXOs[0].utxoId.txID).toEqual(testUTXOID1);
    expect(
      (inputUTXOs[0].output as StakeableLockOut).transferOut.amount(),
    ).toEqual(stakeableUtxoAmt1);
    expect(inputUTXOs[1].utxoId.txID).toEqual(testUTXOID2);
    expect(
      (inputUTXOs[1].output as StakeableLockOut).transferOut.amount(),
    ).toEqual(stakeableUtxoAmt2);
  });

  it('Should not be affected by assets with different asset id', () => {
    const stakeableUtxoAmt1 = 200000000n;
    const stakeableUtxoAmt2 = 400000000n;
    const amountRemainingToStake = 500000000n;

    const { amountsToStake, changeOutputs } = useSpendableLockedUTXOs({
      amountsToBurn: new Map(),
      ...defaultSpendResult(),
      utxos: [
        getStakeableLockoutOutput(testUTXOID1, stakeableUtxoAmt1),
        getStakeableLockoutOutput(
          testUTXOID1,
          stakeableUtxoAmt2,
          undefined,
          Id.fromString('1'),
        ),
      ],
      fromAddresses: addressesFromBytes(fromAddressBytes),
      amountsToStake: new Map([
        [testContext.avaxAssetID, amountRemainingToStake],
      ]), // amount remaining to stake
      options: { minIssuanceTime: 0 } as any,
    });

    expect(changeOutputs.length).toEqual(0);
    expect(amountsToStake.get(testContext.avaxAssetID)).toEqual(
      amountRemainingToStake - stakeableUtxoAmt1,
    );
  });
});
