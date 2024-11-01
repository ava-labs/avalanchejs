import { fromAddressBytes, getValidUtxo } from '../../../fixtures/transactions';
import { describe, it, expect } from 'vitest';

import { addressesFromBytes } from '../../../utils';
import { testContext } from '../../../fixtures/context';
import { useUnlockedUTXOs } from './useUnlockedUTXOs';
import { BigIntPr } from '../../../serializable/primitives';
import { defaultSpendResult } from '../../utils/calculateSpend';

describe('src/vms/pvm/spend/useUnlockedUTXOs.spec.ts', () => {
  it('Should pay gas and stake amount plus have some change', () => {
    const { changeOutputs, stakeOutputs, amountsToBurn } = useUnlockedUTXOs({
      ...defaultSpendResult(),
      amountsToBurn: new Map([[testContext.avaxAssetID, 4900n]]),
      utxos: [getValidUtxo(new BigIntPr(10000n))],
      fromAddresses: addressesFromBytes(fromAddressBytes),
      amountsToStake: new Map([[testContext.avaxAssetID, 4900n]]),
      options: { changeAddresses: fromAddressBytes } as any,
    });
    expect(changeOutputs.length).toEqual(1);
    expect(BigInt(changeOutputs[0].output.amount())).toEqual(BigInt(200n));

    expect(stakeOutputs.length).toEqual(1);
    expect(BigInt(stakeOutputs[0].output.amount())).toEqual(BigInt(4900n));

    expect(amountsToBurn.get(testContext.avaxAssetID)).toEqual(0n);
  });
});
