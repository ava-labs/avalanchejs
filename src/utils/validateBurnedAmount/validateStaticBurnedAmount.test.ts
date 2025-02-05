import { testAddress1, testAddress2 } from '../../fixtures/vms';
import { describe, it, expect } from 'vitest';

import { testContext } from '../../fixtures/context';
import { Utxo } from '../../serializable/avax/utxo';
import { utxoId } from '../../fixtures/avax';
import { Address, Id } from '../../serializable/fxs/common';
import { OutputOwners, TransferOutput } from '../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../serializable/primitives';
import {
  newBaseTx as avmBaseTx,
  newExportTx as avmExportTx,
  newImportTx as avmImportTx,
} from '../../vms/avm';
import { TransferableOutput } from '../../serializable';
import { validateStaticBurnedAmount } from './validateStaticBurnedAmount';

const utxoMock = new Utxo(
  utxoId(),
  Id.fromString(testContext.avaxAssetID),
  new TransferOutput(
    new BigIntPr(1000000000000n),
    new OutputOwners(new BigIntPr(0n), new Int(1), [
      Address.fromBytes(testAddress1)[0],
    ]),
  ),
);

const outputMock = new TransferableOutput(
  Id.fromString(testContext.avaxAssetID),
  new TransferOutput(
    new BigIntPr(100000000n),
    new OutputOwners(new BigIntPr(0n), new Int(1), [
      Address.fromBytes(testAddress2)[0],
    ]),
  ),
);

describe('validateStaticBurnedAmount', () => {
  const testData = [
    {
      name: 'base tx on X',
      unsignedTx: avmBaseTx(
        testContext,
        [testAddress1],
        [utxoMock],
        [outputMock],
      ),
      correctBurnedAmount: testContext.baseTxFee,
    },
    {
      name: 'export from X',
      unsignedTx: avmExportTx(
        testContext,
        'P',
        [testAddress1],
        [utxoMock],
        [outputMock],
      ),
      correctBurnedAmount: testContext.baseTxFee,
    },
    {
      name: 'import from X',
      unsignedTx: avmImportTx(
        testContext,
        'P',
        [utxoMock],
        [testAddress2],
        [testAddress1],
      ),
      correctBurnedAmount: testContext.baseTxFee,
    },
  ];

  describe.each(testData)('$name', ({ unsignedTx, correctBurnedAmount }) => {
    it('returns true if burned amount is correct', () => {
      const result = validateStaticBurnedAmount({
        unsignedTx,
        context: testContext,
        burnedAmount: correctBurnedAmount,
      });

      expect(result).toStrictEqual({
        isValid: true,
        txFee: correctBurnedAmount,
      });
    });

    it('returns false if burned amount is not correct', () => {
      const result = validateStaticBurnedAmount({
        unsignedTx,
        context: testContext,
        burnedAmount: correctBurnedAmount - 1n,
      });

      expect(result).toStrictEqual({
        isValid: false,
        txFee: correctBurnedAmount,
      });
    });
  });
});
