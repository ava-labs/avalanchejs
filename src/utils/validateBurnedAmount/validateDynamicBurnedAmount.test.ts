import { validateDynamicBurnedAmount } from './validateDynamicBurnedAmount';
import { describe, it, expect } from 'vitest';

describe('validateDynamicBurnedAmount', () => {
  it('throws an expected error if feeTolerance is less than 0', () => {
    expect(() =>
      validateDynamicBurnedAmount({
        burnedAmount: (280750n * 75n) / 100n, // 25% lower,
        feeAmount: 280750n,
        feeTolerance: -1,
      }),
    ).toThrowError('feeTolerance must be be non-negative.');
  });

  it('returns false if burned amount is over the tolerance range', () => {
    const resultHigher = validateDynamicBurnedAmount({
      burnedAmount: (280750n * 151n) / 100n, // 51% higher
      feeAmount: 280750n,
      feeTolerance: 50.9,
    });
    expect(resultHigher).toStrictEqual({
      isValid: false,
      txFee: (280750n * 151n) / 100n,
    });
  });

  it('returns false if burned amount is below the tolerance range', () => {
    const resultLower = validateDynamicBurnedAmount({
      burnedAmount: (280750n * 49n) / 100n, // 51% lower
      feeAmount: 280750n,
      feeTolerance: 50.9,
    });
    expect(resultLower).toStrictEqual({
      isValid: false,
      txFee: (280750n * 49n) / 100n,
    });
  });
  it('returns true if burned amount is within the min tolerance range', () => {
    const resultLower = validateDynamicBurnedAmount({
      burnedAmount: (280750n * 75n) / 100n, // 25% lower
      feeAmount: 280750n,
      feeTolerance: 50.9,
    });
    expect(resultLower).toStrictEqual({
      isValid: true,
      txFee: (280750n * 75n) / 100n,
    });
  });
  it('returns true if burned amount is within the max tolerance range', () => {
    const resultHigher = validateDynamicBurnedAmount({
      burnedAmount: (280750n * 125n) / 100n, // 25% higher
      feeAmount: 280750n,
      feeTolerance: 500.9,
    });
    expect(resultHigher).toStrictEqual({
      isValid: true,
      txFee: (280750n * 125n) / 100n,
    });
  });
});
