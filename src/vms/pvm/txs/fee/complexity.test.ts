import { utils } from '../../../..';
import { describe, test, expect } from 'vitest';

import { utxoId } from '../../../../fixtures/avax';
import { address, id } from '../../../../fixtures/common';
import {
  bigIntPr,
  blsPublicKeyBytes,
  blsSignatureBytes,
  int,
  ints,
  warpMessageBytes,
} from '../../../../fixtures/primitives';
import { signer } from '../../../../fixtures/pvm';
import { txHexToTransaction } from '../../../../fixtures/transactions';
import {
  Bytes,
  Input,
  OutputOwners,
  TransferInput,
  TransferOutput,
  TransferableInput,
  TransferableOutput,
} from '../../../../serializable';
import { L1Validator } from '../../../../serializable/fxs/pvm/L1Validator';
import { PChainOwner } from '../../../../serializable/fxs/pvm/pChainOwner';
import {
  ProofOfPossession,
  SignerEmpty,
  StakeableLockIn,
  StakeableLockOut,
} from '../../../../serializable/pvm';
import { createDimensions } from '../../../common/fees/dimensions';
import {
  getAuthComplexity,
  getL1ValidatorComplexity,
  getInputComplexity,
  getOutputComplexity,
  getOwnerComplexity,
  getSignerComplexity,
  getTxComplexity,
  getWarpComplexity,
} from './complexity';
import {
  TEST_TRANSACTIONS,
  TEST_UNSUPPORTED_TRANSACTIONS,
} from './fixtures/transactions';
import {
  INTRINSIC_BLS_AGGREGATE_COMPUTE,
  INTRINSIC_BLS_VERIFY_COMPUTE,
  INTRINSIC_WARP_DB_READS,
} from './constants';

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
          compute: 0,
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
          compute: 200,
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
          compute: 600,
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
          compute: 600,
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
          compute: 1_050,
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
          compute: 0,
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
          compute: 200,
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
          compute: 600,
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

  describe('getWarpComplexity', () => {
    // Example Warp Message
    const warpMessage = warpMessageBytes();

    test('throws "not enough bytes" error from empty warp message', () => {
      expect(() => {
        getWarpComplexity(new Bytes(new Uint8Array()));
      }).toThrow('not enough bytes');
    });

    test('complexity from warp message', () => {
      const result = getWarpComplexity(new Bytes(warpMessage));
      const numOfSigners = 1;

      expect(result).toEqual(
        createDimensions({
          bandwidth: warpMessage.length,
          dbRead: INTRINSIC_WARP_DB_READS,
          dbWrite: 0,
          compute:
            INTRINSIC_BLS_VERIFY_COMPUTE +
            INTRINSIC_BLS_AGGREGATE_COMPUTE * numOfSigners,
        }),
      );
    });
  });

  describe('getL1ValidatorComplexity', () => {
    test('any can spend', () => {
      const pChainOwner = PChainOwner.fromNative([], 1);
      const validator = L1Validator.fromNative(
        'NodeID-MqgFXT8JhorbEW2LpTDGePBBhv55SSp3M',
        1n,
        1n,
        new ProofOfPossession(blsPublicKeyBytes(), blsSignatureBytes()),
        pChainOwner,
        pChainOwner,
      );
      const result = getL1ValidatorComplexity(validator);

      expect(result).toEqual(
        createDimensions({
          bandwidth: 200,
          dbRead: 0,
          dbWrite: 4,
          compute: 1_050,
        }),
      );
    });
    test('single remaining balance owner', () => {
      const remainingBalanceOwner = PChainOwner.fromNative(
        [
          utils.bech32ToBytes(
            'P-custom1p8ddr5wfmfq0zv3n2wnst0cm2pfccaudm3wsrs',
          ),
        ],
        1,
      );
      const deactivationOwner = PChainOwner.fromNative([], 1);
      const validator = L1Validator.fromNative(
        'NodeID-MqgFXT8JhorbEW2LpTDGePBBhv55SSp3M',
        1n,
        1n,
        new ProofOfPossession(blsPublicKeyBytes(), blsSignatureBytes()),
        remainingBalanceOwner,
        deactivationOwner,
      );
      const result = getL1ValidatorComplexity(validator);

      expect(result).toEqual(
        createDimensions({
          bandwidth: 220,
          dbRead: 0,
          dbWrite: 4,
          compute: 1_050,
        }),
      );
    });
    test('single deactivation owner', () => {
      const deactivationOwner = PChainOwner.fromNative(
        [
          utils.bech32ToBytes(
            'P-custom1p8ddr5wfmfq0zv3n2wnst0cm2pfccaudm3wsrs',
          ),
        ],
        1,
      );
      const remainingBalanceOwner = PChainOwner.fromNative([], 1);
      const validator = L1Validator.fromNative(
        'NodeID-MqgFXT8JhorbEW2LpTDGePBBhv55SSp3M',
        1n,
        1n,
        new ProofOfPossession(blsPublicKeyBytes(), blsSignatureBytes()),
        remainingBalanceOwner,
        deactivationOwner,
      );
      const result = getL1ValidatorComplexity(validator);

      expect(result).toEqual(
        createDimensions({
          bandwidth: 220,
          dbRead: 0,
          dbWrite: 4,
          compute: 1_050,
        }),
      );
    });
    test('remaining balance owner and deactivation owner', () => {
      const pChainOwner = PChainOwner.fromNative(
        [
          utils.bech32ToBytes(
            'P-custom1p8ddr5wfmfq0zv3n2wnst0cm2pfccaudm3wsrs',
          ),
        ],
        1,
      );
      const validator = L1Validator.fromNative(
        'NodeID-MqgFXT8JhorbEW2LpTDGePBBhv55SSp3M',
        1n,
        1n,
        new ProofOfPossession(blsPublicKeyBytes(), blsSignatureBytes()),
        pChainOwner,
        pChainOwner,
      );
      const result = getL1ValidatorComplexity(validator);

      expect(result).toEqual(
        createDimensions({
          bandwidth: 240,
          dbRead: 0,
          dbWrite: 4,
          compute: 1_050,
        }),
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
