import { testContext } from '../../fixtures/context';
import { describe, beforeEach, it, expect } from 'vitest';

import {
  testAvaxAssetID,
  testOwnerXAddress,
  testUtxos,
} from '../../fixtures/transactions';
import {
  TransferableInput,
  TransferableOutput,
  UTXOID,
} from '../../serializable/avax';
import { Utxo } from '../../serializable/avax/utxo';
import type { BaseTx, ExportTx, ImportTx } from '../../serializable/avm';
import { Id } from '../../serializable/fxs/common';
import {
  Input,
  OutputOwners,
  TransferInput,
  TransferOutput,
} from '../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../serializable/primitives';
import { hexToBuffer } from '../../utils';
import { newExportTx, newImportTx } from '../pvm';
import { newBaseTx } from './builder';
import { checkFeeIsCorrect } from '../pvm/etna-builder/utils/feeForTesting';
import { feeState } from '../../fixtures/pvm';

describe('AVMBuilder', () => {
  let utxos: Utxo[];
  beforeEach(() => {
    utxos = testUtxos();
  });
  it('importTx', async () => {
    const toAddress = hexToBuffer('0x5432112345123451234512');
    const tx = newImportTx(
      {
        sourceChainId: testContext.cBlockchainID,
        utxos,
        toAddressesBytes: [toAddress],
        fromAddressesBytes: [testOwnerXAddress.toBytes()],
        feeState: feeState(),
      },
      testContext,
    );

    const importTx = tx.getTx() as ImportTx;

    expect(importTx.ins).toHaveLength(1);
    expect(importTx.ins[0].assetId).toEqual(testAvaxAssetID);
    expect(Number(importTx.ins[0].amount())).toEqual(50 * 1e9);
    expect(importTx.ins[0].utxoID.ID()).toEqual(utxos[2].ID());
  });

  it('importTx Low amt', async () => {
    const toAddress = hexToBuffer('0x5432112345123451234512');
    utxos[2] = new Utxo(
      new UTXOID(Id.fromHex('0x1234512345123451234516'), new Int(0)),
      testAvaxAssetID,
      new TransferOutput(
        new BigIntPr(BigInt(50 * 1e5)),
        OutputOwners.fromNative([testOwnerXAddress.toBytes()]),
      ),
    );

    const unsignedTx = newImportTx(
      {
        sourceChainId: testContext.cBlockchainID,
        utxos,
        toAddressesBytes: [toAddress],
        fromAddressesBytes: [testOwnerXAddress.toBytes()],
        feeState: feeState(),
      },
      testContext,
    );

    const importTx = unsignedTx.getTx() as ImportTx;
    const { inputs, outputs } = importTx.baseTx;
    const [, expectedAmountConsumed, expectedFee] = checkFeeIsCorrect({
      unsignedTx,
      inputs,
      outputs,
      feeState: feeState(),
    });

    expect(importTx.ins).toHaveLength(1);
    expect(importTx.ins[0].assetId).toEqual(testAvaxAssetID);
    expect(Number(importTx.ins[0].amount())).toEqual(50 * 1e5);

    const expectedAmountConsumedOriginal = expectedAmountConsumed[
      testContext.avaxAssetID
    ]
      .slice(0, -1) //remove n
      .replaceAll('_', '');
    const expectedAmountConsumedBigInt = BigInt(expectedAmountConsumedOriginal);

    expect((importTx.baseTx.outputs as TransferableOutput[])[0].amount()).toBe(
      expectedAmountConsumedBigInt - expectedFee,
    );
    expect(importTx.ins[0].utxoID.ID()).toEqual(utxos[2].ID());
  });

  it('importTx no utxos available', async () => {
    const toAddress = hexToBuffer('0x5432112345123451234512');
    utxos.pop();

    expect(() =>
      newImportTx(
        {
          sourceChainId: testContext.cBlockchainID,
          utxos,
          toAddressesBytes: [toAddress],
          fromAddressesBytes: [testOwnerXAddress.toBytes()],
          feeState: feeState(),
        },
        testContext,
      ),
    ).toThrow();
  });

  it('exportTx', () => {
    const toAddress = hexToBuffer('0x5432112345123451234512');
    const tnsOut = TransferableOutput.fromNative(
      testAvaxAssetID.toString(),
      BigInt(5 * 1e9),
      [toAddress],
    );
    const tx = newExportTx(
      {
        destinationChainId: testContext.cBlockchainID,
        fromAddressesBytes: [testOwnerXAddress.toBytes()],
        utxos,
        outputs: [tnsOut],
        feeState: feeState(),
      },
      testContext,
    );
    const exportTx = tx.getTx() as ExportTx;
    const { inputs, outputs } = exportTx.baseTx;
    const [, expectedAmountConsumed, expectedFee] = checkFeeIsCorrect({
      unsignedTx: tx,
      inputs,
      outputs,
      feeState: feeState(),
    });
    const expectedAmountConsumedOriginal = expectedAmountConsumed[
      testContext.avaxAssetID
    ]
      .slice(0, -1) //remove n
      .replaceAll('_', '');
    const expectedAmountConsumedBigInt = BigInt(expectedAmountConsumedOriginal);
    expect(exportTx.outs as TransferableOutput[]).toEqual([tnsOut]);
    expect(exportTx.baseTx.inputs as TransferableInput[]).toEqual([
      new TransferableInput(
        utxos[2].utxoId,
        testAvaxAssetID,
        new TransferInput(
          new BigIntPr(BigInt(50 * 1e9)),
          Input.fromNative([0]),
        ),
      ),
    ]);

    expect(exportTx.baseTx.outputs as TransferableOutput[]).toEqual([
      new TransferableOutput(
        testAvaxAssetID,
        new TransferOutput(
          new BigIntPr(expectedAmountConsumedBigInt - expectedFee),
          OutputOwners.fromNative([testOwnerXAddress.toBytes()]),
        ),
      ),
    ]);
  });

  it('exportTx', () => {
    const toAddress = hexToBuffer('0x5432112345123451234512');
    const tnsOut = TransferableOutput.fromNative(
      testAvaxAssetID.toString(),
      BigInt(5 * 1e9),
      [toAddress],
    );
    utxos.pop();
    expect(() =>
      newExportTx(
        {
          destinationChainId: testContext.cBlockchainID,
          fromAddressesBytes: [testOwnerXAddress.toBytes()],
          utxos,
          outputs: [tnsOut],
          feeState: feeState(),
        },
        testContext,
      ),
    ).toThrow();
  });

  it('baseTx', () => {
    const toAddress = hexToBuffer('0x5432112345123451234512');
    const tnsOut = TransferableOutput.fromNative(
      testAvaxAssetID.toString(),
      BigInt(1 * 1e9),
      [toAddress],
    );
    const tx = newBaseTx(testContext, [testOwnerXAddress.toBytes()], utxos, [
      tnsOut,
    ]);
    const {
      baseTx: { inputs, outputs },
    } = tx.getTx() as BaseTx;

    expect(outputs.length).toEqual(2);
    expect(outputs as TransferableOutput[]).toEqual([
      tnsOut,
      new TransferableOutput(
        testAvaxAssetID,
        new TransferOutput(
          new BigIntPr(48999000000n), // input - amount sent - fee
          OutputOwners.fromNative([testOwnerXAddress.toBytes()]),
        ),
      ),
    ]);

    expect(inputs.length).toEqual(1);
    expect(inputs as TransferableInput[]).toEqual([
      new TransferableInput(
        utxos[2].utxoId,
        testAvaxAssetID,
        new TransferInput(
          new BigIntPr(BigInt(50 * 1e9)),
          Input.fromNative([0]),
        ),
      ),
    ]);
  });
});
