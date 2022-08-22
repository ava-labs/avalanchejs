import { testContext } from '../../fixtures/context';
import {
  testAvaxAssetID,
  testOwnerAddress,
  testUtxos,
} from '../../fixtures/transactions';
import {
  TransferableInput,
  TransferableOutput,
  UTXOID,
} from '../../serializable/avax';
import { Utxo } from '../../serializable/avax/utxo';
import type { ExportTx, ImportTx } from '../../serializable/avm';
import { Id } from '../../serializable/fxs/common';
import {
  Input,
  OutputOwners,
  TransferInput,
  TransferOutput,
} from '../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../serializable/primitives';
import { hexToBuffer } from '../../utils';
import { XBuilder } from './builder';

describe('AVMBuilder', () => {
  let utxos: Utxo[];
  let builder: XBuilder;
  beforeEach(() => {
    builder = new XBuilder(testContext);

    utxos = testUtxos();
  });
  it('importTx', async () => {
    const toAddress = hexToBuffer('0x5432112345123451234512');
    const tx = builder.newImportTx(
      testContext.cBlockchainID,
      utxos,
      [toAddress],
      [testOwnerAddress.toBytes()],
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
        OutputOwners.fromNative([testOwnerAddress.toBytes()]),
      ),
    );

    const tx = builder.newImportTx(
      testContext.cBlockchainID,
      utxos,
      [toAddress],
      [testOwnerAddress.toBytes()],
    );

    const importTx = tx.getTx() as ImportTx;

    expect(importTx.ins).toHaveLength(1);
    expect(importTx.ins[0].assetId).toEqual(testAvaxAssetID);
    expect(Number(importTx.ins[0].amount())).toEqual(50 * 1e5);
    expect((importTx.baseTx.outputs as TransferableOutput[])[0].amount()).toBe(
      BigInt(40 * 1e5),
    );
    expect(importTx.ins[0].utxoID.ID()).toEqual(utxos[2].ID());
  });

  it('importTx no utxos available', async () => {
    const toAddress = hexToBuffer('0x5432112345123451234512');
    utxos.pop();

    expect(() =>
      builder.newImportTx(
        testContext.cBlockchainID,
        utxos,
        [toAddress],
        [testOwnerAddress.toBytes()],
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
    const tx = builder.newExportTx(
      testContext.cBlockchainID,
      [testOwnerAddress.toBytes()],
      utxos,
      [tnsOut],
    );
    const exportTx = tx.getTx() as ExportTx;
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
          new BigIntPr(44999000000n),
          OutputOwners.fromNative([testOwnerAddress.toBytes()]),
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
      builder.newExportTx(
        testContext.cBlockchainID,
        [testOwnerAddress.toBytes()],
        utxos,
        [tnsOut],
      ),
    ).toThrow();
  });
});
