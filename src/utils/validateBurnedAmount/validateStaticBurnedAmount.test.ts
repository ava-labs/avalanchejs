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
import {
  newBaseTx as pvmBaseTx,
  newExportTx as pvmExportTx,
  newImportTx as pvmImportTx,
  newAddValidatorTx,
  newAddDelegatorTx,
  newCreateSubnetTx,
  newCreateBlockchainTx,
  newAddSubnetValidatorTx,
  newTransformSubnetTx,
  newAddPermissionlessValidatorTx,
  newAddPermissionlessDelegatorTx,
  newRemoveSubnetValidatorTx,
  newTransferSubnetOwnershipTx,
} from '../../vms/pvm';
import { TransferableOutput } from '../../serializable';
import { nodeId } from '../../fixtures/common';
import { testSubnetId } from '../../fixtures/transactions';
import { PrimaryNetworkID } from '../../constants/networkIDs';
import {
  blsPublicKeyBytes,
  blsSignatureBytes,
} from '../../fixtures/primitives';
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
    {
      name: 'base tx on P',
      unsignedTx: pvmBaseTx(
        testContext,
        [testAddress1],
        [utxoMock],
        [outputMock],
      ),
      correctBurnedAmount: testContext.baseTxFee,
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
      correctBurnedAmount: testContext.baseTxFee,
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
      correctBurnedAmount: testContext.baseTxFee,
    },
    {
      name: 'add validator',
      unsignedTx: newAddValidatorTx(
        testContext,
        [utxoMock],
        [testAddress1],
        nodeId().toString(),
        0n,
        1n,
        2n,
        [testAddress1],
        3,
      ),
      correctBurnedAmount: testContext.addPrimaryNetworkValidatorFee,
    },
    {
      name: 'add delegator',
      unsignedTx: newAddDelegatorTx(
        testContext,
        [utxoMock],
        [testAddress1],
        nodeId().toString(),
        0n,
        1n,
        2n,
        [testAddress1],
      ),
      correctBurnedAmount: testContext.addPrimaryNetworkDelegatorFee,
    },
    {
      name: 'create subnet',
      unsignedTx: newCreateSubnetTx(
        testContext,
        [utxoMock],
        [testAddress1],
        [testAddress1],
      ),
      correctBurnedAmount: testContext.createSubnetTxFee,
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
      correctBurnedAmount: testContext.createBlockchainTxFee,
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
      correctBurnedAmount: testContext.addSubnetValidatorFee,
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
      correctBurnedAmount: testContext.baseTxFee,
    },
    {
      name: 'transform subnet',
      unsignedTx: newTransformSubnetTx(
        testContext,
        [utxoMock],
        [testAddress1],
        Id.fromHex(testSubnetId).toString(),
        '123456789ABC',
        1n,
        2n,
        3n,
        4n,
        5n,
        6n,
        1,
        2,
        3,
        4n,
        5,
        6,
        [0, 2],
      ),
      correctBurnedAmount: testContext.transformSubnetTxFee,
    },
    {
      name: 'add permissionless validator (primary network)',
      unsignedTx: newAddPermissionlessValidatorTx(
        testContext,
        [utxoMock],
        [testAddress1],
        nodeId().toString(),
        PrimaryNetworkID.toString(),
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
      correctBurnedAmount: testContext.addPrimaryNetworkValidatorFee,
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
      correctBurnedAmount: testContext.addSubnetValidatorFee,
    },
    {
      name: 'add permissionless delegator (primary network)',
      unsignedTx: newAddPermissionlessDelegatorTx(
        testContext,
        [utxoMock],
        [testAddress1],
        nodeId().toString(),
        PrimaryNetworkID.toString(),
        0n,
        120n,
        1800000n,
        [],
        {},
        1,
        0n,
      ),
      correctBurnedAmount: testContext.addPrimaryNetworkDelegatorFee,
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
      correctBurnedAmount: testContext.addSubnetDelegatorFee,
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
