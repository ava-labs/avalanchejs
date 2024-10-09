import { testAddress1, testAddress2 } from '../fixtures/vms';
import { testContext } from '../fixtures/context';
import { Utxo } from '../serializable/avax/utxo';
import { utxoId } from '../fixtures/avax';
import { Address, Id } from '../serializable/fxs/common';
import { OutputOwners, TransferOutput } from '../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../serializable/primitives';
import {
  newBaseTx as avmBaseTx,
  newExportTx as avmExportTx,
  newImportTx as avmImportTx,
} from '../vms/avm';
import {
  newBaseTx as pvmBaseTx,
  newExportTx as pvmExportTx,
  newImportTx as pvmImportTx,
  newCreateSubnetTx,
  newCreateBlockchainTx,
  newAddSubnetValidatorTx,
  newAddPermissionlessValidatorTx,
  newAddPermissionlessDelegatorTx,
  newRemoveSubnetValidatorTx,
  newTransferSubnetOwnershipTx,
} from '../vms/pvm';
import { TransferableOutput } from '../serializable';
import { nodeId } from '../fixtures/common';
import { feeState as testFeeState } from '../fixtures/pvm';
import { testSubnetId } from '../fixtures/transactions';
import { blsPublicKeyBytes, blsSignatureBytes } from '../fixtures/primitives';
import { validateAvaxBurnedAmountEtna } from './validateAvaxBurnedAmountEtna';

const incorrectBurnedAmount = 1n;
const correctBurnedAmount = 1000000n;

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

describe('validateAvaxBurnedAmountEtna', () => {
  describe('unsupported tx types post-enta', () => {
    const unsupportedTestData = [
      {
        name: 'base tx on X',
        unsignedTx: avmBaseTx(
          testContext,
          [testAddress1],
          [utxoMock],
          [outputMock],
        ),
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
      },
    ];
    describe.each(unsupportedTestData)('$name', ({ unsignedTx }) => {
      it('throws an error if tx type is not supported', () => {
        try {
          validateAvaxBurnedAmountEtna({
            unsignedTx,
            context: testContext,
            burnedAmount: correctBurnedAmount,
            feeState: testFeeState(),
          });
        } catch (error) {
          expect((error as Error).message).toEqual(
            'Unsupported transaction type.',
          );
        }
      });
    });
  });

  const testData = [
    {
      name: 'base tx on P',
      unsignedTx: pvmBaseTx(
        testContext,
        [testAddress1],
        [utxoMock],
        [outputMock],
      ),
    },
    {
      name: 'export from P',
      unsignedTx: pvmExportTx(
        testContext,
        'C',
        [testAddress1],
        [utxoMock],
        [outputMock],
      ),
    },
    {
      name: 'import to P',
      unsignedTx: pvmImportTx(
        testContext,
        'C',
        [utxoMock],
        [testAddress2],
        [testAddress1],
      ),
    },
    {
      name: 'create subnet',
      unsignedTx: newCreateSubnetTx(
        testContext,
        [utxoMock],
        [testAddress1],
        [testAddress1],
      ),
    },
    {
      name: 'create blockchain',
      unsignedTx: newCreateBlockchainTx(
        testContext,
        [utxoMock],
        [testAddress1],
        'subnet',
        'chain',
        'vm',
        ['fx1', 'fx2'],
        {},
        [0],
      ),
    },
    {
      name: 'add subnet validator',
      unsignedTx: newAddSubnetValidatorTx(
        testContext,
        [utxoMock],
        [testAddress1],
        nodeId().toString(),
        0n,
        1n,
        2n,
        'subnet',
        [0],
      ),
    },
    {
      name: 'remove subnet validator',
      unsignedTx: newRemoveSubnetValidatorTx(
        testContext,
        [utxoMock],
        [testAddress1],
        nodeId().toString(),
        Id.fromHex(testSubnetId).toString(),
        [0],
      ),
    },
    {
      name: 'add permissionless validator (subnet)',
      unsignedTx: newAddPermissionlessValidatorTx(
        testContext,
        [utxoMock],
        [testAddress1],
        nodeId().toString(),
        Id.fromHex(testSubnetId).toString(),
        0n,
        120n,
        1800000n,
        [],
        [],
        1,
        {},
        1,
        0n,
        blsPublicKeyBytes(),
        blsSignatureBytes(),
      ),
    },
    {
      name: 'add permissionless delegator (subnet)',
      unsignedTx: newAddPermissionlessDelegatorTx(
        testContext,
        [utxoMock],
        [testAddress1],
        nodeId().toString(),
        Id.fromHex(testSubnetId).toString(),
        0n,
        120n,
        1800000n,
        [],
        {},
        1,
        0n,
      ),
    },
    {
      name: 'transfer subnet ownership',
      unsignedTx: newTransferSubnetOwnershipTx(
        testContext,
        [utxoMock],
        [testAddress1],
        Id.fromHex(testSubnetId).toString(),
        [0, 2],
        [testAddress2],
      ),
    },
  ];

  describe.each(testData)('$name', ({ unsignedTx }) => {
    it('returns true if burned amount is correct', () => {
      const result = validateAvaxBurnedAmountEtna({
        unsignedTx,
        context: testContext,
        burnedAmount: correctBurnedAmount,
        feeState: testFeeState(),
      });

      expect(result).toStrictEqual({
        isValid: true,
        txFee: correctBurnedAmount,
      });
    });

    it('returns false if burned amount is not correct', () => {
      const result = validateAvaxBurnedAmountEtna({
        unsignedTx,
        context: testContext,
        burnedAmount: incorrectBurnedAmount,
        feeState: { ...testFeeState(), price: 10_000n },
      });

      expect(result).toStrictEqual({
        isValid: false,
        txFee: incorrectBurnedAmount,
      });
    });
  });
});
