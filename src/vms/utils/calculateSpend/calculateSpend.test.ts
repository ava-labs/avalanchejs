import { BigIntPr, Int } from '../../../serializable/primitives';
import { describe, it, expect } from 'vitest';

import { testContext } from '../../../fixtures/context';
import {
  fromAddressBytes,
  getLockedUTXO,
  getStakeableLockoutOutput,
  getValidUtxo,
  testAvaxAssetID,
  testUTXOID1,
  testUTXOID2,
  testUTXOID3,
  testUtxos,
} from '../../../fixtures/transactions';
import { addressesFromBytes } from '../../../utils';
import { calculateUTXOSpend } from './calculateSpend';
import {
  useSpendableLockedUTXOs,
  useUnlockedUTXOs,
} from '../../pvm/utxoCalculationFns';
import { compareTransferableOutputs } from '../../../utils/sort';
import {
  OutputOwners,
  TransferableOutput,
  TransferInput,
  TransferOutput,
} from '../../../serializable';
import { TransferableInput } from '../../../serializable';
import { Address, Id } from '../../../serializable/fxs/common';
import { NoSigMatchError } from './utils';
import { useAvmAndCorethUTXOs } from '../../../vms/avm/utxoCalculationFns';
import type { StakeableLockOut } from '../../../serializable/pvm';
import { StakeableLockIn } from '../../../serializable/pvm';
import { UTXOID } from '../../../serializable/avax';

describe('src/vms/pvm/spend/calculateSpend.spec.ts', () => {
  it('should pay down burn and stake from utxos', () => {
    const burnAmount = 100n;
    const unlockedUTXOAmount = 200n;
    const stakeAmount = 1000000n;

    const stakeAmount1 = 500000n;
    const stakeAmount2 = 600000n;
    const lockTime1 = BigInt(Math.floor(new Date().getTime() / 1000)) + 100000n;
    const lockTime2 = BigInt(Math.floor(new Date().getTime() / 1000)) + 200000n;

    const { stakeOutputs, changeOutputs, inputs } = calculateUTXOSpend(
      new Map([[testContext.avaxAssetID, burnAmount]]),
      new Map([[testContext.avaxAssetID, stakeAmount]]),
      [
        getValidUtxo(new BigIntPr(unlockedUTXOAmount)),
        getStakeableLockoutOutput(testUTXOID1, stakeAmount1, lockTime1),
        getStakeableLockoutOutput(testUTXOID2, stakeAmount2, lockTime2),
      ],
      addressesFromBytes(fromAddressBytes),
      { changeAddresses: fromAddressBytes, minIssuanceTime: 0n } as any,
      [useSpendableLockedUTXOs, useUnlockedUTXOs],
    );

    const getExpectedStakeOut = (lockTime: bigint, amount: bigint) =>
      new TransferableOutput(
        testAvaxAssetID,
        getStakeableLockoutOutput(
          Id.fromHex(''), // does not matter, we only need the output of the UTXO
          amount,
          lockTime,
        ).output as StakeableLockOut,
      );

    const getExpectedStakeInput = (
      utxoID: UTXOID,
      amount: bigint,
      lockTime: bigint,
    ) =>
      new TransferableInput(
        utxoID,
        testAvaxAssetID,
        new StakeableLockIn(
          new BigIntPr(lockTime),
          TransferInput.fromNative(amount, [0]),
        ),
      );

    // sorted stake outputs
    expect(stakeOutputs.length).toEqual(2);

    expect(stakeOutputs[0]).toStrictEqual(
      getExpectedStakeOut(lockTime1, 500000n),
    );
    expect(stakeOutputs[1]).toStrictEqual(
      getExpectedStakeOut(lockTime2, 500000n),
    );

    // sorted inputs
    expect(inputs.length).toEqual(3);

    expect(inputs[0]).toStrictEqual(
      getExpectedStakeInput(
        new UTXOID(testUTXOID1, new Int(0)),
        stakeAmount1,
        lockTime1,
      ),
    );
    expect(inputs[1]).toStrictEqual(
      new TransferableInput(
        new UTXOID(testUTXOID3, new Int(0)),
        testAvaxAssetID,
        TransferInput.fromNative(unlockedUTXOAmount, [0]),
      ),
    );
    expect(inputs[2]).toStrictEqual(
      getExpectedStakeInput(
        new UTXOID(testUTXOID2, new Int(0)),
        stakeAmount2,
        lockTime2,
      ),
    );

    // sorted change outputs
    expect(changeOutputs.length).toEqual(2);

    expect(changeOutputs[0]).toStrictEqual(
      new TransferableOutput(
        testAvaxAssetID,
        new TransferOutput(
          new BigIntPr(unlockedUTXOAmount - burnAmount),
          new OutputOwners(
            new BigIntPr(0n),
            new Int(1),
            addressesFromBytes(fromAddressBytes),
          ),
        ),
      ),
    );
    expect(changeOutputs[1]).toStrictEqual(
      getExpectedStakeOut(lockTime2, stakeAmount1 + stakeAmount2 - stakeAmount),
    );
  });
  it('Should verify if the changeOutputs, inputs and stakeOutputs have been sorted', () => {
    const burnAmount = 100n;
    const unlockedUTXOAmount = 200n;
    const lockedUTXOAmount = 1000000n;
    const stakeUTXOAmount = 1000000n;

    const { stakeOutputs, changeOutputs, inputs } = calculateUTXOSpend(
      new Map([[testContext.avaxAssetID, burnAmount]]),
      new Map([[testContext.avaxAssetID, stakeUTXOAmount]]),
      [
        getValidUtxo(new BigIntPr(unlockedUTXOAmount)),
        getLockedUTXO(new BigIntPr(lockedUTXOAmount)),
      ],
      addressesFromBytes(fromAddressBytes),
      { changeAddresses: fromAddressBytes } as any,
      [useSpendableLockedUTXOs, useUnlockedUTXOs],
    );

    expect(stakeOutputs).toEqual(
      [...stakeOutputs].sort(compareTransferableOutputs),
    );
    expect(changeOutputs).toEqual(
      [...changeOutputs].sort(compareTransferableOutputs),
    );
    expect(inputs).toEqual([...inputs].sort(TransferableInput.compare));
  });

  it('Should throw an error when the UTXO owner "fromAddress" doesnt match any UTXOs', () => {
    const tryUseFunctionAndThrowMismatchError = (useFn: (() => any)[]) => {
      return calculateUTXOSpend(
        new Map([[testContext.avaxAssetID, 100n]]),
        new Map([[testContext.avaxAssetID, 10000n]]),
        [
          getValidUtxo(new BigIntPr(10000n)),
          getLockedUTXO(new BigIntPr(10000n)),
          getStakeableLockoutOutput(testUTXOID1, 300n),
          getStakeableLockoutOutput(testUTXOID2, 10000n),
          ...testUtxos(),
        ],
        // use random address that doesnt belong to any utxos we have in the test
        addressesFromBytes([
          Address.fromString(
            'X-fuji1xwdz5ca4pl443ghm6ez63m7yr64wu6u7qhksa2',
          ).toBytes(),
        ]),
        {
          changeAddresses: fromAddressBytes,
          minIssuanceTime: 1000000000000n,
        } as any,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        [...useFn],
      );
    };

    function catchAndEqualNoSigMatch(useFns) {
      try {
        tryUseFunctionAndThrowMismatchError(useFns);
      } catch (err) {
        expect(err).toEqual(NoSigMatchError);
      }
    }

    catchAndEqualNoSigMatch([useUnlockedUTXOs]);
    catchAndEqualNoSigMatch([useSpendableLockedUTXOs, useUnlockedUTXOs]);
    catchAndEqualNoSigMatch([useAvmAndCorethUTXOs]);
  });
});
