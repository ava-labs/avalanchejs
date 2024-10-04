import { testFeeConfig } from '../../../../fixtures/feeConfig';
import { txHexToTransaction } from '../../../../fixtures/transactions';
import { calculateFee } from './calculator';
import {
  TEST_DYNAMIC_PRICE,
  TEST_DYNAMIC_WEIGHTS,
  TEST_TRANSACTIONS,
  TEST_UNSUPPORTED_TRANSACTIONS,
} from './fixtures/transactions';

describe('Calculator', () => {
  describe('calculateFee', () => {
    test.each(TEST_TRANSACTIONS)(
      'calculates the fee for $name',
      ({ txHex, expectedDynamicFee }) => {
        const result = calculateFee(txHexToTransaction('PVM', txHex), {
          ...testFeeConfig,
          weights: TEST_DYNAMIC_WEIGHTS,
          minPrice: TEST_DYNAMIC_PRICE,
        });

        expect(result).toBe(expectedDynamicFee);
      },
    );

    test.each(TEST_UNSUPPORTED_TRANSACTIONS)(
      'unsupported tx - $name',
      ({ txHex }) => {
        const tx = txHexToTransaction('PVM', txHex);

        expect(() => {
          calculateFee(tx, {
            ...testFeeConfig,
            weights: TEST_DYNAMIC_WEIGHTS,
            minPrice: TEST_DYNAMIC_PRICE,
          });
        }).toThrow('Unsupported transaction type.');
      },
    );
  });
});
