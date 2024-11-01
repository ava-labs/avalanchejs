import { testContext } from '../../fixtures/context';
import { describe, it } from 'vitest';

import {
  getTransferableInputForTest,
  testAvaxAssetID,
  testOwnerXAddress,
  testUtxos,
} from '../../fixtures/transactions';
import { expectTxs } from '../../fixtures/utils/expectTx';
import { TransferableOutput } from '../../serializable/avax';
import { ExportTx, ImportTx, Input, Output } from '../../serializable/evm';
import { Address, Id } from '../../serializable/fxs/common';
import { BigIntPr, Int } from '../../serializable/primitives';
import { hexToBuffer, isTransferOut } from '../../utils';
import { AvaxToNAvax } from '../../utils/avaxToNAvax';
import { newExportTxFromBaseFee, newImportTxFromBaseFee } from './builder';

describe('CorethBuilder', () => {
  const baseFee = 25n;
  const fromAddress = testOwnerXAddress.toBytes();
  const toAddress = hexToBuffer('0x5432112345123451234512');

  it('exportTx', () => {
    const tx = newExportTxFromBaseFee(
      testContext,
      baseFee,
      AvaxToNAvax(1),
      testContext.xBlockchainID,
      fromAddress,
      [toAddress],
      3n,
    );

    const expectedTx = new ExportTx(
      new Int(testContext.networkID),
      Id.fromString(testContext.cBlockchainID),
      Id.fromString(testContext.xBlockchainID),
      [
        new Input(
          testOwnerXAddress,
          new BigIntPr(1000280750n),
          testAvaxAssetID,
          new BigIntPr(3n),
        ),
      ],
      [
        TransferableOutput.fromNative(testContext.avaxAssetID, 1000000000n, [
          toAddress,
        ]),
      ],
    );
    expectTxs(tx.getTx(), expectedTx);
  });

  it('importTx', () => {
    const tx = newImportTxFromBaseFee(
      testContext,
      toAddress,
      [fromAddress],
      testUtxos().filter((utxo) => isTransferOut(utxo.output)),
      testContext.xBlockchainID,
      baseFee,
    );

    const expectedTx = new ImportTx(
      new Int(testContext.networkID),
      Id.fromString(testContext.cBlockchainID),
      Id.fromString(testContext.xBlockchainID),
      [getTransferableInputForTest()],
      [
        new Output(
          Address.fromString('C-avax12sepzg69zg69zg69zgmpqwf3'),
          new BigIntPr(50000000000n),
          testAvaxAssetID,
        ),
      ],
    );

    expectTxs(tx.getTx(), expectedTx);
  });
});
