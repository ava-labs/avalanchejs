import { utxoId } from '../../../../fixtures/avax';
import { address, id } from '../../../../fixtures/common';
import { bigIntPr, int, ints } from '../../../../fixtures/primitives';
import { signer } from '../../../../fixtures/pvm';
import { txHexToTransaction } from '../../../../fixtures/transactions';
import {
  Input,
  OutputOwners,
  TransferInput,
  TransferOutput,
  TransferableInput,
  TransferableOutput,
} from '../../../../serializable';
import {
  SignerEmpty,
  StakeableLockIn,
  StakeableLockOut,
} from '../../../../serializable/pvm';
import { createDimensions } from '../../../common/fees/dimensions';
import {
  getAuthComplexity,
  getInputComplexity,
  getOutputComplexity,
  getOwnerComplexity,
  getSignerComplexity,
  getTxComplexity,
} from './complexity';
import {
  TEST_TRANSACTIONS,
  TEST_UNSUPPORTED_TRANSACTIONS,
} from './fixtures/transactions';

const makeOutputOwners = (numOfAddresses = 0) =>
  new OutputOwners(
    bigIntPr(),
    int(),
    new Array(numOfAddresses).fill(address()),
  );

const makeTransferableOutput = (numOfAddresses = 0) =>
  new TransferableOutput(
    id(),
    new TransferOutput(bigIntPr(), makeOutputOwners(numOfAddresses)),
  );

const makeTransferableInput = (numOfSigInts = 0) =>
  new TransferableInput(
    utxoId(),
    id(),
    new TransferInput(
      bigIntPr(),
      new Input(new Array(numOfSigInts).fill(int())),
    ),
  );

/**
 * These tests are based off the tests found in the AvalancheGo repository:
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/platformvm/txs/fee/complexity_test.go
 */
describe('Complexity', () => {
  describe('getOutputComplexity', () => {
    test('empty transferable output', () => {
      const result = getOutputComplexity([]);

      expect(result).toEqual(
        createDimensions({ bandwidth: 0, dbRead: 0, dbWrite: 0, compute: 0 }),
      );
    });

    test('any can spend', () => {
      const result = getOutputComplexity([makeTransferableOutput()]);

      expect(result).toEqual(
        createDimensions({ bandwidth: 60, dbRead: 0, dbWrite: 1, compute: 0 }),
      );
    });

    test('one owner', () => {
      const result = getOutputComplexity([makeTransferableOutput(1)]);

      expect(result).toEqual(
        createDimensions({ bandwidth: 80, dbRead: 0, dbWrite: 1, compute: 0 }),
      );
    });

    test('three owners', () => {
      const result = getOutputComplexity([makeTransferableOutput(3)]);

      expect(result).toEqual(
        createDimensions({ bandwidth: 120, dbRead: 0, dbWrite: 1, compute: 0 }),
      );
    });

    test('locked stakeable', () => {
      const result = getOutputComplexity([
        new TransferableOutput(
          id(),
          new StakeableLockOut(
            bigIntPr(),
            new TransferOutput(bigIntPr(), makeOutputOwners(3)),
          ),
        ),
      ]);

      expect(result).toEqual(
        createDimensions({ bandwidth: 132, dbRead: 0, dbWrite: 1, compute: 0 }),
      );
    });
  });

  describe('getInputComplexity', () => {
    test('any can spend', () => {
      const result = getInputComplexity([makeTransferableInput()]);

      expect(result).toEqual(
        createDimensions({
          bandwidth: 92,
          dbRead: 1,
          dbWrite: 1,
          compute: 0, // TODO: Implement
        }),
      );
    });

    test('one owner', () => {
      const result = getInputComplexity([makeTransferableInput(1)]);

      expect(result).toEqual(
        createDimensions({
          bandwidth: 161,
          dbRead: 1,
          dbWrite: 1,
          compute: 0, // TODO: Implement
        }),
      );
    });

    test('three owners', () => {
      const result = getInputComplexity([makeTransferableInput(3)]);

      expect(result).toEqual(
        createDimensions({
          bandwidth: 299,
          dbRead: 1,
          dbWrite: 1,
          compute: 0, // TODO: Implement
        }),
      );
    });

    test('locked stakeable', () => {
      const result = getInputComplexity([
        new TransferableInput(
          utxoId(),
          id(),
          new StakeableLockIn(
            bigIntPr(),
            new TransferInput(bigIntPr(), new Input(new Array(3).fill(int()))),
          ),
        ),
      ]);

      expect(result).toEqual(
        createDimensions({
          bandwidth: 311,
          dbRead: 1,
          dbWrite: 1,
          compute: 0, // TODO: Implement
        }),
      );
    });
  });

  describe('getOwnerComplexity', () => {
    test('any can spend', () => {
      const result = getOwnerComplexity(makeOutputOwners());

      expect(result).toEqual(
        createDimensions({ bandwidth: 16, dbRead: 0, dbWrite: 0, compute: 0 }),
      );
    });

    test('one owner', () => {
      const result = getOwnerComplexity(makeOutputOwners(1));

      expect(result).toEqual(
        createDimensions({ bandwidth: 36, dbRead: 0, dbWrite: 0, compute: 0 }),
      );
    });

    test('three owners', () => {
      const result = getOwnerComplexity(makeOutputOwners(3));

      expect(result).toEqual(
        createDimensions({ bandwidth: 76, dbRead: 0, dbWrite: 0, compute: 0 }),
      );
    });
  });

  describe('getSignerComplexity', () => {
    test('empty signer', () => {
      const result = getSignerComplexity(new SignerEmpty());

      expect(result).toEqual(
        createDimensions({ bandwidth: 0, dbRead: 0, dbWrite: 0, compute: 0 }),
      );
    });

    test('bls pop', () => {
      const result = getSignerComplexity(signer());

      expect(result).toEqual(
        createDimensions({
          bandwidth: 144,
          dbRead: 0,
          dbWrite: 0,
          compute: 0, // TODO: Implement
        }),
      );
    });
  });

  describe('getAuthComplexity', () => {
    test('any can spend', () => {
      const result = getAuthComplexity(new Input([]));

      expect(result).toEqual(
        createDimensions({
          bandwidth: 8,
          dbRead: 0,
          dbWrite: 0,
          compute: 0, // TODO: Implement
        }),
      );
    });

    test('one owner', () => {
      const result = getAuthComplexity(new Input([int()]));

      expect(result).toEqual(
        createDimensions({
          bandwidth: 77,
          dbRead: 0,
          dbWrite: 0,
          compute: 0, // TODO: Implement
        }),
      );
    });

    test('three owners', () => {
      const result = getAuthComplexity(new Input(ints()));

      expect(result).toEqual(
        createDimensions({
          bandwidth: 215,
          dbRead: 0,
          dbWrite: 0,
          compute: 0, // TODO: Implement
        }),
      );
    });

    test('invalid auth type', () => {
      expect(() => {
        getAuthComplexity(int());
      }).toThrow(
        'Unable to calculate auth complexity of transaction. Expected Input as subnet auth.',
      );
    });
  });

  describe('getTxComplexity', () => {
    test.each(TEST_TRANSACTIONS)('$name', ({ txHex, expectedComplexity }) => {
      const tx = txHexToTransaction('PVM', txHex);

      const result = getTxComplexity(tx);

      expect(result).toEqual(expectedComplexity);
    });

    test.each(TEST_UNSUPPORTED_TRANSACTIONS)(
      'unsupported tx - $name',
      ({ txHex }) => {
        const tx = txHexToTransaction('PVM', txHex);

        expect(() => {
          getTxComplexity(tx);
        }).toThrow('Unsupported transaction type.');
      },
    );
  });
});
