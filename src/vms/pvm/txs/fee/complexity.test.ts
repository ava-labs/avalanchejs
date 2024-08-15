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
import { makeDimension } from '../../../common/fees/dimensions';
import {
  authComplexity,
  inputComplexity,
  outputComplexity,
  ownerComplexity,
  signerComplexity,
} from './complexity';

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

describe('Complexity', () => {
  describe('outputComplexity', () => {
    test('empty transferable output', () => {
      const result = outputComplexity([]);

      expect(result).toEqual(makeDimension(0, 0, 0, 0));
    });

    test('any can spend', () => {
      const result = outputComplexity([makeTransferableOutput()]);

      expect(result).toEqual(makeDimension(60, 0, 1, 0));
    });

    test('one owner', () => {
      const result = outputComplexity([makeTransferableOutput(1)]);

      expect(result).toEqual(makeDimension(80, 0, 1, 0));
    });

    test('three owners', () => {
      const result = outputComplexity([makeTransferableOutput(3)]);

      expect(result).toEqual(makeDimension(120, 0, 1, 0));
    });

    test('locked stakeable', () => {
      const result = outputComplexity([
        new TransferableOutput(
          id(),
          new StakeableLockOut(
            bigIntPr(),
            new TransferOutput(bigIntPr(), makeOutputOwners(3)),
          ),
        ),
      ]);

      expect(result).toEqual(makeDimension(132, 0, 1, 0));
    });
  });

  describe('inputComplexity', () => {
    test('any can spend', () => {
      const result = inputComplexity([makeTransferableInput()]);

      expect(result).toEqual(
        makeDimension(
          92,
          1,
          1,
          0, // TODO: Implement
        ),
      );
    });

    test('one owner', () => {
      const result = inputComplexity([makeTransferableInput(1)]);

      expect(result).toEqual(
        makeDimension(
          161,
          1,
          1,
          0, // TODO: Implement
        ),
      );
    });

    test('three owners', () => {
      const result = inputComplexity([makeTransferableInput(3)]);

      expect(result).toEqual(
        makeDimension(
          299,
          1,
          1,
          0, // TODO: Implement
        ),
      );
    });

    test('locked stakeable', () => {
      const result = inputComplexity([
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
        makeDimension(
          311,
          1,
          1,
          0, // TODO: Implement
        ),
      );
    });
  });

  describe('ownerComplexity', () => {
    test('any can spend', () => {
      const result = ownerComplexity(makeOutputOwners());

      expect(result).toEqual(makeDimension(16, 0, 0, 0));
    });

    test('one owner', () => {
      const result = ownerComplexity(makeOutputOwners(1));

      expect(result).toEqual(makeDimension(36, 0, 0, 0));
    });

    test('three owners', () => {
      const result = ownerComplexity(makeOutputOwners(3));

      expect(result).toEqual(makeDimension(76, 0, 0, 0));
    });
  });

  describe('signerComplexity', () => {
    test('empty signer', () => {
      const result = signerComplexity(new SignerEmpty());

      expect(result).toEqual(makeDimension(0, 0, 0, 0));
    });

    test('bls pop', () => {
      const result = signerComplexity(signer());

      expect(result).toEqual(
        makeDimension(
          144,
          0,
          0,
          // TODO: Implement compute
          0,
        ),
      );
    });
  });

  describe('authComplexity', () => {
    test('any can spend', () => {
      const result = authComplexity(new Input([]));

      expect(result).toEqual(
        makeDimension(
          8,
          0,
          0,
          0, // TODO: Implement
        ),
      );
    });

    test('one owner', () => {
      const result = authComplexity(new Input([int()]));

      expect(result).toEqual(
        makeDimension(
          77,
          0,
          0,
          0, // TODO: Implement
        ),
      );
    });

    test('three owners', () => {
      const result = authComplexity(new Input(ints()));

      expect(result).toEqual(
        makeDimension(
          215,
          0,
          0,
          0, // TODO: Implement
        ),
      );
    });

    test('invalid auth type', () => {
      expect(() => {
        authComplexity(int());
      }).toThrow(
        'Unable to calculate auth complexity of transaction. Expected Input as subnet auth.',
      );
    });
  });
});
