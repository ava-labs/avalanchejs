import { hexToBuffer, unpackWithManager } from '../../../../utils';
import { calculateFee } from './calculator';
import {
  TEST_DYNAMIC_PRICE,
  TEST_DYNAMIC_WEIGHTS,
  TEST_TRANSACTIONS,
  TEST_UNSUPPORTED_TRANSACTIONS,
} from './fixtures/transactions';

const txHexToPVMTransaction = (txHex: string) => {
  const txBytes = hexToBuffer(txHex);

  // console.log('txBytes length:', txBytes.length, '=== expected bandwidth');

  return unpackWithManager('PVM', txBytes);
};

describe('Calculator', () => {
  describe('calculateFee', () => {
    test.each(TEST_TRANSACTIONS)(
      'calculates the fee for $name',
      ({ txHex, expectedDynamicFee }) => {
        const result = calculateFee(
          txHexToPVMTransaction(txHex),
          TEST_DYNAMIC_WEIGHTS,
          TEST_DYNAMIC_PRICE,
        );

        expect(result).toBe(expectedDynamicFee);
      },
    );

    test.each(TEST_UNSUPPORTED_TRANSACTIONS)(
      'unsupported tx - $name',
      ({ txHex }) => {
        const tx = txHexToPVMTransaction(txHex);

        expect(() => {
          calculateFee(tx, TEST_DYNAMIC_WEIGHTS, TEST_DYNAMIC_PRICE);
        }).toThrow('Unsupported transaction type.');
      },
    );
  });
});
