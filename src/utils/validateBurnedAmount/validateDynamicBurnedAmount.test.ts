import { validateDynamicBurnedAmount } from './validateDynamicBurnedAmount';

describe('validateDynamicBurnedAmount', () => {
  describe('evm', () => {
    describe('export from C', () => {
      it('throws if feeTolerance is incorrect', () => {
        expect(() =>
          validateDynamicBurnedAmount({
            burnedAmount: (280750n * 75n) / 100n, // 25% lower,
            feeAmount: 280750n,
            feeTolerance: 0.5,
          }),
        ).toThrowError('feeTolerance must be [1,100]');

        expect(() =>
          validateDynamicBurnedAmount({
            burnedAmount: (280750n * 75n) / 100n, // 25% lower,
            feeAmount: 280750n,
            feeTolerance: 101,
          }),
        ).toThrowError('feeTolerance must be [1,100]');
      });

      it('returns true if burned amount is in the tolerance range', () => {
        const resultLower = validateDynamicBurnedAmount({
          burnedAmount: (280750n * 75n) / 100n, // 25% lower
          feeAmount: 280750n,
          feeTolerance: 50.9,
        });

        const resultHigher = validateDynamicBurnedAmount({
          burnedAmount: (280750n * 125n) / 100n, // 25% higher
          feeAmount: 280750n,
          feeTolerance: 50.9,
        });

        expect(resultLower).toStrictEqual({
          isValid: true,
          txFee: (280750n * 75n) / 100n,
        });
        expect(resultHigher).toStrictEqual({
          isValid: true,
          txFee: (280750n * 125n) / 100n,
        });
      });

      it('returns false if burned amount is not in the tolerance range', () => {
        const resultLower = validateDynamicBurnedAmount({
          burnedAmount: (280750n * 49n) / 100n, // 51% lower
          feeAmount: 280750n,
          feeTolerance: 50.9,
        });

        const resultHigher = validateDynamicBurnedAmount({
          burnedAmount: (280750n * 151n) / 100n, // 51% higher
          feeAmount: 280750n,
          feeTolerance: 50.9,
        });

        expect(resultLower).toStrictEqual({
          isValid: false,
          txFee: (280750n * 49n) / 100n,
        });
        expect(resultHigher).toStrictEqual({
          isValid: false,
          txFee: (280750n * 151n) / 100n,
        });
      });
    });
    describe('import to C', () => {
      it('returns true if burned amount is in the tolerance range', () => {
        const resultLower = validateDynamicBurnedAmount({
          burnedAmount: (280750n * 75n) / 100n, // 25% lower
          feeAmount: 280750n,
          feeTolerance: 50.9,
        });

        const resultHigher = validateDynamicBurnedAmount({
          burnedAmount: (280750n * 125n) / 100n, // 25% higher
          feeAmount: 280750n,
          feeTolerance: 50.9,
        });

        expect(resultLower).toStrictEqual({
          isValid: true,
          txFee: (280750n * 75n) / 100n,
        });
        expect(resultHigher).toStrictEqual({
          isValid: true,
          txFee: (280750n * 125n) / 100n,
        });
      });

      it('returns false if burned amount is not in the tolerance range', () => {
        const resultLower = validateDynamicBurnedAmount({
          burnedAmount: (280750n * 49n) / 100n, // 51% lower
          feeAmount: 280750n,
          feeTolerance: 50.9,
        });

        const resultHigher = validateDynamicBurnedAmount({
          burnedAmount: (280750n * 151n) / 100n, // 51% higher
          feeAmount: 280750n,
          feeTolerance: 50.9,
        });

        expect(resultLower).toStrictEqual({
          isValid: false,
          txFee: (280750n * 49n) / 100n,
        });
        expect(resultHigher).toStrictEqual({
          isValid: false,
          txFee: (280750n * 151n) / 100n,
        });
      });
    });
  });

  describe('pvm', () => {
    const testData = [
      {
        name: 'base tx on P',
        feeAmount: 3830000n,
        burnedAmount: 3840000n,
      },
      {
        name: 'export from P',
        feeAmount: 4190000n,
        burnedAmount: 4390000n,
      },
      {
        name: 'import to P',
        feeAmount: 3380000n,
        burnedAmount: 3980000n,
      },
      {
        name: 'create subnet',
        feeAmount: 3430000n,
        burnedAmount: 3930000n,
      },
      {
        name: 'create blockchain',
        feeAmount: 5340000n,
        burnedAmount: 5660000n,
      },
      {
        name: 'add subnet validator',
        feeAmount: 4660000n,
        burnedAmount: 4960000n,
      },
      {
        name: 'remove subnet validator',
        feeAmount: 4420000n,
        burnedAmount: 4420000n,
      },
      {
        name: 'add permissionless validator (subnet)',
        feeAmount: 6570000n,
        burnedAmount: 7570000n,
      },
      {
        name: 'add permissionless delegator (subnet)',
        feeAmount: 4850000n,
        burnedAmount: 4900000n,
      },
      {
        name: 'transfer subnet ownership',
        feeAmount: 5300000n,
        burnedAmount: 5900000n,
      },
    ];

    describe.each(testData)('$name', ({ feeAmount, burnedAmount }) => {
      it('returns true if burned amount is correct', () => {
        const result = validateDynamicBurnedAmount({
          burnedAmount,
          feeAmount,
          feeTolerance: 20,
        });

        expect(result).toStrictEqual({
          isValid: true,
          txFee: burnedAmount,
        });
      });

      it('returns false if burned amount is above max tolerance', () => {
        const result = validateDynamicBurnedAmount({
          burnedAmount: burnedAmount * 30n,
          feeTolerance: 20,
          feeAmount,
        });

        expect(result).toStrictEqual({
          isValid: false,
          txFee: burnedAmount * 30n,
        });
      });

      it('returns false if burned amount is below min tolerance', () => {
        const result = validateDynamicBurnedAmount({
          burnedAmount: burnedAmount / 30n,
          feeTolerance: 20,
          feeAmount,
        });

        expect(result).toStrictEqual({
          isValid: false,
          txFee: burnedAmount / 30n,
        });
      });
    });
  });
});
