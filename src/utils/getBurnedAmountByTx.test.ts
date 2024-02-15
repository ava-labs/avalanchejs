import type { AvaxTx } from '../serializable/avax';
import { UTXOID } from '../serializable/avax';
import { TransferableOutput } from '../serializable/avax';
import { newExportTxFromBaseFee, newImportTxFromBaseFee } from '../vms/evm';
import { getBurnedAmountByTx } from './getBurnedAmountByTx';
import { testContext } from '../fixtures/context';
import { testEthAddress1, testAddress1, testAddress2 } from '../fixtures/vms';
import { nodeId } from '../fixtures/common';
import { Utxo } from '../serializable/avax/utxo';
import { OutputOwners, TransferOutput } from '../serializable/fxs/secp256k1';
import { Address, Id } from '../serializable/fxs/common';
import { BigIntPr, Int } from '../serializable/primitives';
import {
  newBaseTx,
  newExportTx as avmExportTx,
  newImportTx as avmImportTx,
} from '../vms/avm';
import {
  newExportTx as pvmExportTx,
  newImportTx as pvmImportTx,
  newAddValidatorTx,
  newAddDelegatorTx,
  newCreateSubnetTx,
  newCreateBlockchainTx,
  newAddSubnetValidatorTx,
} from '../vms/pvm';
import type { EVMTx } from '../serializable/evm/abstractTx';
import { testUTXOID1, testUTXOID2 } from '../fixtures/transactions';
import { costCorethTx } from './costs';
import { StakeableLockOut } from '../serializable/pvm';

const getUtxoMock = (
  utxoId: Id,
  amount = 100000000n,
  assetId: string = testContext.avaxAssetID,
) =>
  new Utxo(
    new UTXOID(utxoId, new Int(0)),
    Id.fromString(assetId),
    new TransferOutput(
      new BigIntPr(amount),
      new OutputOwners(new BigIntPr(0n), new Int(1), [
        Address.fromBytes(testAddress1)[0],
      ]),
    ),
  );

const getStakeableLockoutUtxoMock = (
  utxoId: Id,
  lockTime: bigint,
  amount = 100000000n,
  assetId: string = testContext.avaxAssetID,
) =>
  new Utxo(
    new UTXOID(utxoId, new Int(0)),
    Id.fromString(assetId),
    new StakeableLockOut(
      new BigIntPr(lockTime),
      new TransferOutput(
        new BigIntPr(amount),
        new OutputOwners(new BigIntPr(0n), new Int(1), [
          Address.fromBytes(testAddress1)[0],
        ]),
      ),
    ),
  );

const getOutputMock = (
  amount = 100000000n,
  assetId: string = testContext.avaxAssetID,
) =>
  new TransferableOutput(
    Id.fromString(assetId),
    new TransferOutput(
      new BigIntPr(amount),
      new OutputOwners(new BigIntPr(0n), new Int(1), [
        Address.fromBytes(testAddress2)[0],
      ]),
    ),
  );

describe('getBurnedAmountByTx', () => {
  describe('C chain atomic transactions', () => {
    it('calculates the burned amount of export tx correctly', () => {
      const baseFee = 25n;
      const tx = newExportTxFromBaseFee(
        testContext,
        baseFee,
        1000000000n,
        'X',
        testEthAddress1,
        [testAddress1],
        1n,
      );

      const amounts = getBurnedAmountByTx(tx.getTx() as EVMTx);
      expect(amounts.size).toEqual(1);
      expect(amounts.get(testContext.avaxAssetID)).toEqual(
        baseFee * costCorethTx(tx),
      );
    });

    it('calculates the burned amount of import tx correctly', () => {
      const baseFee = 25n;
      const utxo1 = getUtxoMock(testUTXOID1, 50000000n);
      const utxo2 = getUtxoMock(testUTXOID2, 50000000n);

      const tx = newImportTxFromBaseFee(
        testContext,
        testEthAddress1,
        [testAddress1],
        [utxo1, utxo2],
        'X',
        baseFee,
      );

      const amounts = getBurnedAmountByTx(tx.getTx() as EVMTx);
      expect(amounts.size).toEqual(1);
      expect(amounts.get(testContext.avaxAssetID)).toEqual(
        baseFee * costCorethTx(tx),
      );
    });
  });

  describe('X chain transactions', () => {
    describe('base tx', () => {
      it('calculates the burned amount of base tx correctly (multiple inputs)', () => {
        // 110000000n total input -> 100000000n ouput + 1000000n fee -> 9000000n change
        const utxo1 = getUtxoMock(testUTXOID1, 50000000n);
        const utxo2 = getUtxoMock(testUTXOID2, 60000000n);
        const output = getOutputMock(100000000n);

        const tx = newBaseTx(
          testContext,
          [testAddress1],
          [utxo1, utxo2],
          [output],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.baseTxFee,
        );

        for (const out of tx.baseTx?.outputs ?? []) {
          expect([100000000n, 9000000n]).toContain(out.amount());
        }
      });

      it('calculates the burned amount of base tx correctly (multiple outputs)', () => {
        // 150000000n total input -> 140000000n ouput + 1000000n fee -> 9000000n change
        const utxo = getUtxoMock(testUTXOID1, 150000000n);
        const output1 = getOutputMock(100000000n);
        const output2 = getOutputMock(30000000n);
        const output3 = getOutputMock(10000000n);

        const tx = newBaseTx(
          testContext,
          [testAddress1],
          [utxo],
          [output1, output2, output3],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.baseTxFee,
        );

        for (const out of tx.baseTx?.outputs ?? []) {
          expect([100000000n, 30000000n, 10000000n, 9000000n]).toContain(
            out.amount(),
          );
        }
      });

      it('calculates the burned amount of base tx correctly (multiple inputs and outputs)', () => {
        // 150000000n total input -> 140000000n ouput + 1000000n fee -> 9000000n change
        const utxo1 = getUtxoMock(testUTXOID1, 70000000n);
        const utxo2 = getUtxoMock(testUTXOID1, 80000000n);
        const output1 = getOutputMock(100000000n);
        const output2 = getOutputMock(30000000n);
        const output3 = getOutputMock(10000000n);

        const tx = newBaseTx(
          testContext,
          [testAddress1],
          [utxo1, utxo2],
          [output1, output2, output3],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.baseTxFee,
        );

        for (const out of tx.baseTx?.outputs ?? []) {
          expect([100000000n, 30000000n, 10000000n, 9000000n]).toContain(
            out.amount(),
          );
        }
      });
    });

    describe('export tx', () => {
      it('calculates the burned amount of export tx correctly (multiple inputs)', () => {
        // 110000000n total input -> 100000000n ouput + 1000000n fee -> 9000000n change
        const utxo1 = getUtxoMock(testUTXOID1, 50000000n);
        const utxo2 = getUtxoMock(testUTXOID2, 60000000n);
        const output = getOutputMock(100000000n);

        const tx = avmExportTx(
          testContext,
          'P',
          [testAddress1],
          [utxo1, utxo2],
          [output],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.baseTxFee,
        );
      });

      it('calculates the burned amount of export tx correctly (multiple outputs)', () => {
        // 150000000n total input -> 140000000n ouput + 1000000n fee -> 9000000n change
        const utxo = getUtxoMock(testUTXOID1, 150000000n);
        const output1 = getOutputMock(100000000n);
        const output2 = getOutputMock(30000000n);
        const output3 = getOutputMock(10000000n);

        const tx = avmExportTx(
          testContext,
          'P',
          [testAddress1],
          [utxo],
          [output1, output2, output3],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.baseTxFee,
        );
      });

      it('calculates the burned amount of export tx correctly (multiple inputs and outputs)', () => {
        // 150000000n total input -> 140000000n ouput + 1000000n fee -> 9000000n change
        const utxo1 = getUtxoMock(testUTXOID1, 70000000n);
        const utxo2 = getUtxoMock(testUTXOID1, 80000000n);
        const output1 = getOutputMock(100000000n);
        const output2 = getOutputMock(30000000n);
        const output3 = getOutputMock(10000000n);

        const tx = avmExportTx(
          testContext,
          'P',
          [testAddress1],
          [utxo1, utxo2],
          [output1, output2, output3],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.baseTxFee,
        );
      });
    });

    describe('import tx', () => {
      it('calculates the burned amount of import tx correctly', () => {
        // 110000000n total input -> 1000000n fee -> 109000000n change
        const utxo1 = getUtxoMock(testUTXOID1, 50000000n);
        const utxo2 = getUtxoMock(testUTXOID2, 60000000n);

        const tx = avmImportTx(
          testContext,
          'P',
          [utxo1, utxo2],
          [testAddress2],
          [testAddress1],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.baseTxFee,
        );
      });
    });
  });

  describe('P chain transactions', () => {
    describe('export tx', () => {
      it('calculates the burned amount of export tx correctly (multiple inputs)', () => {
        // 110000000n total input -> 100000000n ouput + 1000000n fee -> 9000000n change
        const utxo1 = getUtxoMock(testUTXOID1, 50000000n);
        const utxo2 = getUtxoMock(testUTXOID2, 60000000n);
        const output = getOutputMock(100000000n);

        const tx = pvmExportTx(
          testContext,
          'C',
          [testAddress1],
          [utxo1, utxo2],
          [output],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.baseTxFee,
        );
      });

      it('calculates the burned amount of export tx correctly (multiple outputs)', () => {
        // 150000000n total input -> 140000000n ouput + 1000000n fee -> 9000000n change
        const utxo = getUtxoMock(testUTXOID1, 150000000n);
        const output1 = getOutputMock(100000000n);
        const output2 = getOutputMock(30000000n);
        const output3 = getOutputMock(10000000n);

        const tx = pvmExportTx(
          testContext,
          'C',
          [testAddress1],
          [utxo],
          [output1, output2, output3],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.baseTxFee,
        );
      });

      it('calculates the burned amount of export tx correctly (multiple inputs and outputs)', () => {
        // 150000000n total input -> 140000000n ouput + 1000000n fee -> 9000000n change
        const utxo1 = getUtxoMock(testUTXOID1, 70000000n);
        const utxo2 = getUtxoMock(testUTXOID1, 80000000n);
        const output1 = getOutputMock(100000000n);
        const output2 = getOutputMock(30000000n);
        const output3 = getOutputMock(10000000n);

        const tx = pvmExportTx(
          testContext,
          'C',
          [testAddress1],
          [utxo1, utxo2],
          [output1, output2, output3],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.baseTxFee,
        );
      });
    });

    describe('import tx', () => {
      it('calculates the burned amount of import tx correctly', () => {
        // 110000000n total input -> 1000000n fee -> 9000000n change
        const utxo1 = getUtxoMock(testUTXOID1, 50000000n);
        const utxo2 = getUtxoMock(testUTXOID2, 60000000n);

        const tx = pvmImportTx(
          testContext,
          'C',
          [utxo1, utxo2],
          [testAddress2],
          [testAddress1],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.baseTxFee,
        );
      });
    });

    describe('add validator tx', () => {
      it('calculates the burned amount of add validator tx correctly', () => {
        // 110000000n total input -> 100000000n stake + 0 fee -> 10000000n change
        const weight = 100000000n;
        const utxo1 = getUtxoMock(testUTXOID1, 50000000n);
        const utxo2 = getUtxoMock(testUTXOID2, 60000000n);

        const tx = newAddValidatorTx(
          testContext,
          [utxo1, utxo2],
          [testAddress1],
          nodeId().toString(),
          0n,
          1n,
          weight,
          [testAddress1],
          3,
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.addPrimaryNetworkValidatorFee,
        );
      });

      it('calculates the burned amount of add validator tx correctly (stakeable lock out)', () => {
        // 110000000n total input -> 100000000n stake + 0 fee -> 10000000n change
        const weight = 100000000n;
        const lockTime =
          BigInt(Math.floor(new Date().getTime() / 1000)) + 10000n;
        const utxo1 = getStakeableLockoutUtxoMock(
          testUTXOID1,
          lockTime,
          50000000n,
        );
        const utxo2 = getStakeableLockoutUtxoMock(
          testUTXOID2,
          lockTime,
          60000000n,
        );

        const tx = newAddValidatorTx(
          testContext,
          [utxo1, utxo2],
          [testAddress1],
          nodeId().toString(),
          0n,
          1n,
          weight,
          [testAddress1],
          3,
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.addPrimaryNetworkValidatorFee,
        );
      });

      it('calculates the burned amount of add validator tx correctly (hybrid)', () => {
        // 110000000n total input -> 100000000n stake + 0 fee -> 10000000n change
        const weight = 100000000n;
        const lockTime =
          BigInt(Math.floor(new Date().getTime() / 1000)) + 10000n;
        const utxo1 = getStakeableLockoutUtxoMock(
          testUTXOID1,
          lockTime,
          50000000n,
        );
        const utxo2 = getUtxoMock(testUTXOID2, 60000000n);

        const tx = newAddValidatorTx(
          testContext,
          [utxo1, utxo2],
          [testAddress1],
          nodeId().toString(),
          0n,
          1n,
          weight,
          [testAddress1],
          3,
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.addPrimaryNetworkValidatorFee,
        );
      });
    });

    describe('add delegator tx', () => {
      it('calculates the burned amount of add delegator tx correctly', () => {
        // 110000000n total input -> 100000000n stake + 0 fee -> 10000000n change
        const weight = 100000000n;
        const utxo1 = getUtxoMock(testUTXOID1, 50000000n);
        const utxo2 = getUtxoMock(testUTXOID2, 60000000n);

        const tx = newAddDelegatorTx(
          testContext,
          [utxo1, utxo2],
          [testAddress1],
          nodeId().toString(),
          0n,
          1n,
          weight,
          [testAddress1],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.addPrimaryNetworkDelegatorFee,
        );
      });

      it('calculates the burned amount of add delegator tx correctly (stakeable lock out)', () => {
        // 110000000n total input -> 100000000n stake + 0 fee -> 10000000n change
        const weight = 100000000n;
        const lockTime =
          BigInt(Math.floor(new Date().getTime() / 1000)) + 10000n;
        const utxo1 = getStakeableLockoutUtxoMock(
          testUTXOID1,
          lockTime,
          50000000n,
        );
        const utxo2 = getStakeableLockoutUtxoMock(
          testUTXOID2,
          lockTime,
          60000000n,
        );

        const tx = newAddDelegatorTx(
          testContext,
          [utxo1, utxo2],
          [testAddress1],
          nodeId().toString(),
          0n,
          1n,
          weight,
          [testAddress1],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.addPrimaryNetworkDelegatorFee,
        );
      });

      it('calculates the burned amount of add delegator tx correctly (hybrid)', () => {
        // 110000000n total input -> 100000000n stake + 0 fee -> 10000000n change
        const weight = 100000000n;
        const lockTime =
          BigInt(Math.floor(new Date().getTime() / 1000)) + 10000n;
        const utxo1 = getStakeableLockoutUtxoMock(
          testUTXOID1,
          lockTime,
          50000000n,
        );
        const utxo2 = getUtxoMock(testUTXOID2, 60000000n);

        const tx = newAddDelegatorTx(
          testContext,
          [utxo1, utxo2],
          [testAddress1],
          nodeId().toString(),
          0n,
          1n,
          weight,
          [testAddress1],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.addPrimaryNetworkDelegatorFee,
        );
      });
    });

    describe('create subnet tx', () => {
      it('calculates the burned amount of create subnet tx correctly', () => {
        // 1100000000n total input -> 1000000000n fee -> 100000000n change
        const utxo1 = getUtxoMock(testUTXOID1, 500000000n);
        const utxo2 = getUtxoMock(testUTXOID2, 600000000n);

        const tx = newCreateSubnetTx(
          testContext,
          [utxo1, utxo2],
          [testAddress1],
          [testAddress1],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.createSubnetTxFee,
        );
      });
    });

    describe('create blockchain', () => {
      it('calculates the burned amount of create blockchain tx correctly', () => {
        // 1100000000n total input -> 1000000000n fee -> 100000000n change
        const utxo1 = getUtxoMock(testUTXOID1, 500000000n);
        const utxo2 = getUtxoMock(testUTXOID2, 600000000n);

        const tx = newCreateBlockchainTx(
          testContext,
          [utxo1, utxo2],
          [testAddress1],
          'subnet',
          'chain',
          'vm',
          ['fx1', 'fx2'],
          {},
          [0],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.createBlockchainTxFee,
        );
      });
    });

    describe('add subnet validor tx', () => {
      it('calculates the burned amount of add subnet validor tx correctly', () => {
        // 1100000n total input -> 0 stake + 1000000n fee -> 100000n change
        const weight = 10000000n;
        const utxo1 = getUtxoMock(testUTXOID1, 500000n);
        const utxo2 = getUtxoMock(testUTXOID2, 600000n);

        const tx = newAddSubnetValidatorTx(
          testContext,
          [utxo1, utxo2],
          [testAddress1],
          nodeId().toString(),
          0n,
          1n,
          weight,
          'subnet',
          [0],
        ).getTx() as AvaxTx;

        const amounts = getBurnedAmountByTx(tx);
        expect(amounts.size).toEqual(1);
        expect(amounts.get(testContext.avaxAssetID)).toEqual(
          testContext.addSubnetValidatorFee,
        );
      });
    });
  });
});
