import { testContext } from '../../fixtures/context';
import {
  fromAddressBytes,
  getBaseTxForTest,
  getTransferableInputForTest,
  getTransferableOutForTest,
  testAvaxAssetID,
  testOwnerAddress,
  testUtxos,
} from '../../fixtures/transactions';
import { expectTxs } from '../../fixtures/utils/expectTx';
import { testAddress1 } from '../../fixtures/vms';
import {
  BaseTx,
  TransferableInput,
  TransferableOutput,
  UTXOID,
} from '../../serializable/avax';
import { Utxo } from '../../serializable/avax/utxo';
import { Id } from '../../serializable/fxs/common';
import { OutputOwners, TransferOutput } from '../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../serializable/primitives';
import {
  AddDelegatorTx,
  AddValidatorTx,
  ExportTx,
  ImportTx,
  StakeableLockOut,
  Validator,
} from '../../serializable/pvm';
import { hexToBuffer } from '../../utils';
import {
  newAddDelegatorTx,
  newAddValidatorTx,
  newExportTx,
  newImportTx,
} from './builder';

describe('pvmBuilder', () => {
  const nodeID = 'NodeID-2m38qc95mhHXtrhjyGbe7r2NhniqHHJRB';
  const toAddress = hexToBuffer('0x5432112345123451234512');

  const getRewardsOwners = () => OutputOwners.fromNative([toAddress]);

  it('importTx', () => {
    const utxos = testUtxos();
    const tx = newImportTx(
      testContext,
      testContext.cBlockchainID,
      utxos,
      [testAddress1],
      fromAddressBytes,
    );
    const importTx = tx.getTx() as ImportTx;

    const expectedTx = new ImportTx(
      BaseTx.fromNative(
        testContext.networkID,
        testContext.pBlockchainID,
        [
          TransferableOutput.fromNative(testContext.avaxAssetID, 49999000000n, [
            testAddress1,
          ]),
        ],
        [],
        new Uint8Array([]),
      ),
      Id.fromString(testContext.cBlockchainID),
      [TransferableInput.fromUtxoAndSigindicies(utxos[2], [0])],
    );

    expect(JSON.stringify(importTx, null, 2)).toEqual(
      JSON.stringify(expectedTx, null, 2),
    );
  });

  it('exportTx', () => {
    const tnsOut = TransferableOutput.fromNative(
      testContext.avaxAssetID,
      BigInt(5 * 1e9),
      [toAddress],
    );
    const unsignedTx = newExportTx(
      testContext,
      testContext.cBlockchainID,
      fromAddressBytes,
      testUtxos(),
      [tnsOut],
    );

    const expectedTx = new ExportTx(
      BaseTx.fromNative(
        testContext.networkID,
        testContext.pBlockchainID,
        [
          TransferableOutput.fromNative(
            testContext.avaxAssetID,
            44999000000n,
            fromAddressBytes,
          ),
        ],
        [getTransferableInputForTest()],
        new Uint8Array(),
      ),
      Id.fromString(testContext.cBlockchainID),
      [tnsOut],
    );

    expectTxs(unsignedTx.getTx(), expectedTx);
  });

  it('AddValidatorTx', () => {
    const unsignedTx = newAddValidatorTx(
      testContext,
      testUtxos(),
      fromAddressBytes,
      nodeID,
      100n,
      200n,
      BigInt(1e9),
      [toAddress],
      30 * 10000,
    );

    const expectedTx = new AddValidatorTx(
      getBaseTxForTest(49000000000n, testContext.pBlockchainID),
      Validator.fromNative(nodeID, 100n, 200n, BigInt(1e9)),
      [getTransferableOutForTest(1000000000n)],
      getRewardsOwners(),
      new Int(30 * 10000),
    );

    expectTxs(unsignedTx.getTx(), expectedTx);
  });

  it('AddValidatorTx', () => {
    const utxos = testUtxos();
    const lockedUtxo = new Utxo(
      new UTXOID(Id.fromHex('0x1234512345123451234516'), new Int(0)),
      testAvaxAssetID,
      new StakeableLockOut(
        new BigIntPr(0n),
        new TransferOutput(
          new BigIntPr(BigInt(50 * 1e9)),
          OutputOwners.fromNative([testOwnerAddress.toBytes()]),
        ),
      ),
    );

    utxos.push(lockedUtxo);
    const unsignedTx = newAddValidatorTx(
      testContext,
      utxos,
      fromAddressBytes,
      nodeID,
      100n,
      200n,
      BigInt(1e9),
      [toAddress],
      30 * 10000,
    );

    const expectedTx = new AddValidatorTx(
      getBaseTxForTest(49000000000n, testContext.pBlockchainID),
      Validator.fromNative(nodeID, 100n, 200n, BigInt(1e9)),
      [getTransferableOutForTest(1000000000n)],
      getRewardsOwners(),
      new Int(30 * 10000),
    );

    expectTxs(unsignedTx.getTx(), expectedTx);
  });

  it('AddDelegatorTx', () => {
    const unsignedTx = newAddDelegatorTx(
      testContext,
      testUtxos(),
      fromAddressBytes,
      nodeID,
      100n,
      200n,
      BigInt(1e9),
      [toAddress],
    );

    const expectedTx = new AddDelegatorTx(
      getBaseTxForTest(49000000000n, testContext.pBlockchainID),
      Validator.fromNative(nodeID, 100n, 200n, BigInt(1e9)),
      [getTransferableOutForTest(1000000000n)],
      getRewardsOwners(),
    );

    expectTxs(unsignedTx.getTx(), expectedTx);
  });
});
