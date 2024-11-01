import { isStakeableLockOut, isTransferOut } from '../../utils';
import { assert, describe, it, expect } from 'vitest';

import {
  getStakeableLockedTransferableOutForTest,
  getTransferableOutForTest,
} from '../../fixtures/transactions';

import { consolidateOutputs } from './consolidateOutputs';

describe('consolidateOutputs', () => {
  it('consolidate eligible TransferOuts', () => {
    // GIVEN
    const a = getTransferableOutForTest(BigInt(100));
    const b = getTransferableOutForTest(BigInt(50));
    const c = getTransferableOutForTest(BigInt(50));

    // WHEN
    const consolidated = consolidateOutputs([a, b, c]);

    // THEN
    expect(consolidated.length).toEqual(1);
    const conslidatedOutput = consolidated[0];
    expect(conslidatedOutput.amount()).toEqual(BigInt(200));
    expect(conslidatedOutput.getAssetId()).toEqual(a.getAssetId());
    if (isTransferOut(conslidatedOutput.output) && isTransferOut(a.output)) {
      expect(
        conslidatedOutput.output.outputOwners.equals(a.output.outputOwners),
      ).toBeTruthy();
    } else {
      assert.fail(
        'The consolidated output and first test output should both be transferOuts.',
      );
    }
  });
  it('consolidates eligible StakeableLockouts', () => {
    // GIVEN
    const a = getStakeableLockedTransferableOutForTest(BigInt(100), BigInt(0));
    const b = getStakeableLockedTransferableOutForTest(BigInt(200), BigInt(0));
    const c = getStakeableLockedTransferableOutForTest(BigInt(200), BigInt(0));

    // WHEN
    const consolidated = consolidateOutputs([a, b, c]);

    // THEN
    expect(consolidated.length).toEqual(1);
    const conslidatedOutput = consolidated[0];
    expect(conslidatedOutput.amount()).toEqual(BigInt(500));
    expect(conslidatedOutput.getAssetId()).toEqual(a.getAssetId());
    if (
      isStakeableLockOut(conslidatedOutput.output) &&
      isStakeableLockOut(a.output)
    ) {
      expect(conslidatedOutput.output.getLocktime()).toEqual(
        a.output.getLocktime(),
      );
      expect(
        conslidatedOutput.output
          .getOutputOwners()
          .equals(a.output.getOutputOwners()),
      ).toBeTruthy();
    } else {
      assert.fail(
        'The consolidated output and first test output should both be stakeableLockouts.',
      );
    }
  });
  it('consolidates heterogenous inputs', () => {
    // GIVEN
    const tOutA = getTransferableOutForTest(BigInt(50));
    const tOutB = getTransferableOutForTest(BigInt(100));
    const stlOutA = getStakeableLockedTransferableOutForTest(
      BigInt(100),
      BigInt(0),
    );
    const stlOutB = getStakeableLockedTransferableOutForTest(
      BigInt(200),
      BigInt(0),
    );

    // WHEN
    const consolidated = consolidateOutputs([tOutA, tOutB, stlOutA, stlOutB]);

    // THEN
    expect(consolidated.length).toEqual(2);
    // THEN - TransferOut
    expect(consolidated[0].amount()).toEqual(BigInt(150));
    expect(consolidated[0].getAssetId()).toEqual(tOutA.getAssetId());
    if (isTransferOut(consolidated[0].output) && isTransferOut(tOutA.output)) {
      expect(
        consolidated[0].output.outputOwners.equals(tOutA.output.outputOwners),
      ).toBeTruthy();
    } else {
      assert.fail(
        'The consolidated output and first test output should both be transferOuts.',
      );
    }
    // THEN - StakeableLockouts
    expect(consolidated[1].amount()).toEqual(BigInt(300));
    if (
      isStakeableLockOut(consolidated[1].output) &&
      isStakeableLockOut(stlOutA.output)
    ) {
      expect(consolidated[1].output.getLocktime()).toEqual(
        stlOutA.output.getLocktime(),
      );
      expect(
        consolidated[1].output
          .getOutputOwners()
          .equals(stlOutA.output.getOutputOwners()),
      ).toBeTruthy();
    } else {
      assert.fail(
        'The consolidated output and third test output should both be stakeableLockouts.',
      );
    }
  });
  it('does not consolidate ineligible TransferOuts - locktime', () => {
    // GIVEN
    const a = getTransferableOutForTest(BigInt(50));
    const b = getTransferableOutForTest(BigInt(50), BigInt(100));

    // WHEN
    const consolidated = consolidateOutputs([a, b]);

    // THEN
    expect(consolidated.length).toEqual(2);
    expect(consolidated[0]).toBe(a);
    expect(consolidated[1]).toBe(b);
  });
  it('does not consolidate ineligible TransferOuts - threshold', () => {
    // GIVEN
    const a = getTransferableOutForTest(BigInt(50), BigInt(100), 2);
    const b = getTransferableOutForTest(BigInt(50), BigInt(100), 1);

    // WHEN
    const consolidated = consolidateOutputs([a, b]);

    // THEN
    expect(consolidated.length).toEqual(2);
    expect(consolidated[0]).toBe(a);
    expect(consolidated[1]).toBe(b);
  });
  it('does not consolidate ineligible StakeableLockouts - locktime', () => {
    // GIVEN
    const a = getStakeableLockedTransferableOutForTest(BigInt(100), BigInt(0));
    const b = getStakeableLockedTransferableOutForTest(
      BigInt(200),
      BigInt(100),
    );

    // WHEN
    const consolidated = consolidateOutputs([a, b]);

    // THEN
    expect(consolidated.length).toEqual(2);
    expect(consolidated[0]).toBe(a);
    expect(consolidated[1]).toBe(b);
  });
  it('handles empty arrays gracefully', () => {
    // WHEN
    const consolidated = consolidateOutputs([]);
    // THEN
    expect(consolidated.length).toEqual(0);
  });
  it('handles single output gracefully', () => {
    // GIVEN
    const a = getStakeableLockedTransferableOutForTest(BigInt(100), BigInt(0));

    // WHEN
    const consolidated = consolidateOutputs([a]);

    // THEN
    expect(consolidated.length).toEqual(1);
    expect(consolidated[0]).toBe(a);
  });
});
