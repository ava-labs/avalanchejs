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
import { testSubnetId } from '../fixtures/transactions';
import { blsPublicKeyBytes, blsSignatureBytes } from '../fixtures/primitives';
import { validateAvaxBurnedAmountEtna } from './validateAvaxBurnedAmountEtna';

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
            burnedAmount: 1000000n,
            baseFee: 1n,
            feeTolerance: 20,
          });
        } catch (error) {
          expect((error as Error).message).toEqual('tx type is not supported');
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
      baseFee: 3830000n,
      burnedAmount: 3840000n,
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
      baseFee: 4190000n,
      burnedAmount: 4390000n,
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
      baseFee: 3380000n,
      burnedAmount: 3980000n,
    },
    {
      name: 'create subnet',
      unsignedTx: newCreateSubnetTx(
        testContext,
        [utxoMock],
        [testAddress1],
        [testAddress1],
      ),
      baseFee: 3430000n,
      burnedAmount: 3930000n,
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
      baseFee: 5340000n,
      burnedAmount: 5660000n,
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
      baseFee: 4660000n,
      burnedAmount: 4960000n,
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
      baseFee: 4420000n,
      burnedAmount: 4420000n,
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
      baseFee: 6570000n,
      burnedAmount: 7570000n,
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
      baseFee: 4850000n,
      burnedAmount: 4900000n,
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
      baseFee: 5300000n,
      burnedAmount: 5900000n,
    },
  ];

  describe.each(testData)('$name', ({ unsignedTx, baseFee, burnedAmount }) => {
    it('returns true if burned amount is correct', () => {
      const result = validateAvaxBurnedAmountEtna({
        unsignedTx,
        burnedAmount,
        baseFee,
        feeTolerance: 20,
      });

      expect(result).toStrictEqual({
        isValid: true,
        txFee: burnedAmount,
      });
    });

    it('returns false if burned amount is not correct', () => {
      const result = validateAvaxBurnedAmountEtna({
        unsignedTx,
        burnedAmount: burnedAmount * 30n,
        feeTolerance: 20,
        baseFee,
      });

      expect(result).toStrictEqual({
        isValid: false,
        txFee: burnedAmount * 30n,
      });
    });
  });
});
