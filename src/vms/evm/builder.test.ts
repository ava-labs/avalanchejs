import { testContext } from '../../fixtures/context';
import { describe, it, expect } from 'vitest';

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
  // a realistic 20 byte address; a short one is not a valid bech32 address
  const toAddress = hexToBuffer('0x5432112345123451234512345123451234512345');

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

  it('importTx burns the fee rather than charging it to an unspendable UTXO', () => {
    // The UTXO set contains getLockedUTXO(): a fee-asset TransferOutput owned
    // by the signer but with a future locktime, so matchOwners rejects it and
    // it never becomes an input. It used to absorb the whole fee budget
    // before that check ran, leaving the spendable 50 AVAX UTXO paid out in
    // full — a zero-burn import that coreth rejects for insufficient funds.
    const tx = newImportTxFromBaseFee(
      testContext,
      toAddress,
      [fromAddress],
      testUtxos().filter((utxo) => isTransferOut(utxo.output)),
      testContext.xBlockchainID,
      baseFee,
    );

    const importedAmount = 50000000000n;
    const burned = 280750n;

    const expectedTx = new ImportTx(
      new Int(testContext.networkID),
      Id.fromString(testContext.cBlockchainID),
      Id.fromString(testContext.xBlockchainID),
      [getTransferableInputForTest()],
      [
        new Output(
          Address.fromString('C-avax12sepzg69zg69zg69zg69zg69zg69zg69l25vwz'),
          new BigIntPr(importedAmount - burned),
          testAvaxAssetID,
        ),
      ],
    );

    expectTxs(tx.getTx(), expectedTx);

    // sum(inputs) - sum(outputs) must equal the fee exactly.
    const built = tx.getTx() as ImportTx;
    const inSum = built.importedInputs.reduce(
      (acc, input) => acc + input.amount(),
      0n,
    );
    const outSum = built.Outs.reduce(
      (acc, out) => acc + out.amount.value(),
      0n,
    );

    expect(inSum - outSum).toEqual(burned);
  });
});
