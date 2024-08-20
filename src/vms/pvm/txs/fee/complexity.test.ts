import { utxoId } from '../../../../fixtures/avax';
import { address, id } from '../../../../fixtures/common';
import { bigIntPr, int, ints } from '../../../../fixtures/primitives';
import { signer } from '../../../../fixtures/pvm';
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
import { hexToBuffer, unpackWithManager } from '../../../../utils';
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

const txHexToPVMTransaction = (txHex: string) => {
  const txBytes = hexToBuffer(txHex);

  // console.log('txBytes length:', txBytes.length, '=== expected bandwidth');

  return unpackWithManager('PVM', txBytes);
};

describe('Complexity', () => {
  describe('getOutputComplexity', () => {
    test('empty transferable output', () => {
      const result = getOutputComplexity([]);

      expect(result).toEqual(createDimensions(0, 0, 0, 0));
    });

    test('any can spend', () => {
      const result = getOutputComplexity([makeTransferableOutput()]);

      expect(result).toEqual(createDimensions(60, 0, 1, 0));
    });

    test('one owner', () => {
      const result = getOutputComplexity([makeTransferableOutput(1)]);

      expect(result).toEqual(createDimensions(80, 0, 1, 0));
    });

    test('three owners', () => {
      const result = getOutputComplexity([makeTransferableOutput(3)]);

      expect(result).toEqual(createDimensions(120, 0, 1, 0));
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

      expect(result).toEqual(createDimensions(132, 0, 1, 0));
    });
  });

  describe('getInputComplexity', () => {
    test('any can spend', () => {
      const result = getInputComplexity([makeTransferableInput()]);

      expect(result).toEqual(
        createDimensions(
          92,
          1,
          1,
          0, // TODO: Implement
        ),
      );
    });

    test('one owner', () => {
      const result = getInputComplexity([makeTransferableInput(1)]);

      expect(result).toEqual(
        createDimensions(
          161,
          1,
          1,
          0, // TODO: Implement
        ),
      );
    });

    test('three owners', () => {
      const result = getInputComplexity([makeTransferableInput(3)]);

      expect(result).toEqual(
        createDimensions(
          299,
          1,
          1,
          0, // TODO: Implement
        ),
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
        createDimensions(
          311,
          1,
          1,
          0, // TODO: Implement
        ),
      );
    });
  });

  describe('getOwnerComplexity', () => {
    test('any can spend', () => {
      const result = getOwnerComplexity(makeOutputOwners());

      expect(result).toEqual(createDimensions(16, 0, 0, 0));
    });

    test('one owner', () => {
      const result = getOwnerComplexity(makeOutputOwners(1));

      expect(result).toEqual(createDimensions(36, 0, 0, 0));
    });

    test('three owners', () => {
      const result = getOwnerComplexity(makeOutputOwners(3));

      expect(result).toEqual(createDimensions(76, 0, 0, 0));
    });
  });

  describe('getSignerComplexity', () => {
    test('empty signer', () => {
      const result = getSignerComplexity(new SignerEmpty());

      expect(result).toEqual(createDimensions(0, 0, 0, 0));
    });

    test('bls pop', () => {
      const result = getSignerComplexity(signer());

      expect(result).toEqual(
        createDimensions(
          144,
          0,
          0,
          // TODO: Implement compute
          0,
        ),
      );
    });
  });

  describe('getAuthComplexity', () => {
    test('any can spend', () => {
      const result = getAuthComplexity(new Input([]));

      expect(result).toEqual(
        createDimensions(
          8,
          0,
          0,
          0, // TODO: Implement
        ),
      );
    });

    test('one owner', () => {
      const result = getAuthComplexity(new Input([int()]));

      expect(result).toEqual(
        createDimensions(
          77,
          0,
          0,
          0, // TODO: Implement
        ),
      );
    });

    test('three owners', () => {
      const result = getAuthComplexity(new Input(ints()));

      expect(result).toEqual(
        createDimensions(
          215,
          0,
          0,
          0, // TODO: Implement
        ),
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
      const tx = txHexToPVMTransaction(txHex);

      const result = getTxComplexity(tx);

      expect(result).toEqual(expectedComplexity);
    });

    test.each(TEST_UNSUPPORTED_TRANSACTIONS)(
      'unsupported tx - $name',
      ({ txHex }) => {
        const tx = txHexToPVMTransaction(txHex);

        expect(() => {
          getTxComplexity(tx);
        }).toThrow('Unsupported transaction type.');
      },
    );
  });
});
