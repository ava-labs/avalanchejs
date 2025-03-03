import { testContext } from '../../../fixtures/context';
import { describe, test, expect, it } from 'vitest';

import {
  getLockedUTXO,
  getNotTransferOutput,
  getTransferableInputForTest,
  getTransferableOutForTest,
  getValidUtxo,
  testAvaxAssetID,
  testGenesisData,
  testOwnerXAddress,
  testSubnetId,
  testUtxos,
  testVMId,
} from '../../../fixtures/transactions';
import { expectTxs } from '../../../fixtures/utils/expectTx';
import {
  BigIntPr,
  BlsSignature,
  Bytes,
  Id,
  Input,
  Int,
  NodeId,
  OutputOwners,
  Stringpr,
  TransferableInput,
  TransferableOutput,
} from '../../../serializable';
import {
  AddSubnetValidatorTx,
  SubnetValidator,
  type BaseTx as PVMBaseTx,
  RemoveSubnetValidatorTx,
  ImportTx,
  ExportTx,
  CreateSubnetTx,
  CreateChainTx,
  AddPermissionlessValidatorTx,
  Signer,
  TransferSubnetOwnershipTx,
  AddPermissionlessDelegatorTx,
  ConvertSubnetToL1Tx,
  ProofOfPossession,
  IncreaseL1ValidatorBalanceTx,
  DisableL1ValidatorTx,
  SetL1ValidatorWeightTx,
  RegisterL1ValidatorTx,
} from '../../../serializable/pvm';
import { BaseTx as AvaxBaseTx } from '../../../serializable/avax';
import { hexToBuffer } from '../../../utils';
import {
  newAddPermissionlessDelegatorTx,
  newAddPermissionlessValidatorTx,
  newAddSubnetValidatorTx,
  newBaseTx,
  newConvertSubnetToL1Tx,
  newCreateChainTx,
  newCreateSubnetTx,
  newDisableL1ValidatorTx,
  newExportTx,
  newImportTx,
  newIncreaseL1ValidatorBalanceTx,
  newRegisterL1ValidatorTx,
  newRemoveSubnetValidatorTx,
  newSetL1ValidatorWeightTx,
  newTransferSubnetOwnershipTx,
} from './builder';
import { testAddress1 } from '../../../fixtures/vms';
import { AvaxToNAvax } from '../../../utils/avaxToNAvax';
import { PrimaryNetworkID } from '../../../constants/networkIDs';
import {
  blsPublicKeyBytes,
  blsSignatureBytes,
  warpMessageBytes,
} from '../../../fixtures/primitives';
import {
  feeState as testFeeState,
  proofOfPossession,
} from '../../../fixtures/pvm';
import { L1Validator } from '../../../serializable/fxs/pvm/L1Validator';
import { PChainOwner } from '../../../serializable/fxs/pvm/pChainOwner';

import { checkFeeIsCorrect } from './utils/feeForTesting';

describe('./src/vms/pvm/etna-builder/builder.test.ts', () => {
  const nodeId = 'NodeID-2m38qc95mhHXtrhjyGbe7r2NhniqHHJRB';
  const toAddress = hexToBuffer('0x5432112345123451234512');
  const feeState = testFeeState();
  const fromAddressesBytes = [testOwnerXAddress.toBytes()];
  const getRewardsOwners = () => OutputOwners.fromNative([toAddress]);

  describe.each([
    {
      name: 'no memo',
      memo: undefined,
    },
    {
      name: 'with memo',
      memo: Buffer.from('memo'),
    },
  ])('$name', ({ memo }) => {
    test('newBaseTx', () => {
      const utxos = testUtxos();

      const transferableOutput = TransferableOutput.fromNative(
        testAvaxAssetID.toString(),
        1_000_000_000n,
        [toAddress],
      );

      const utx = newBaseTx(
        {
          fromAddressesBytes,
          feeState,
          outputs: [transferableOutput],
          memo,
          utxos,
        },
        testContext,
      );

      const { baseTx } = utx.getTx() as PVMBaseTx;
      const { inputs, outputs, memo: txMemo } = baseTx;

      expect(inputs.length).toEqual(1);
      expect(outputs.length).toEqual(2);

      expect(outputs).toContain(transferableOutput);

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      const [amountConsumed, expectedAmountConsumed] = checkFeeIsCorrect({
        unsignedTx: utx,
        inputs,
        outputs,
        feeState,
      });

      expect(amountConsumed).toEqual(expectedAmountConsumed);
    });

    test('newImportTx', () => {
      const VALID_AMOUNT = BigInt(50 * 1e9);
      const utxos = [
        getLockedUTXO(),
        getNotTransferOutput(),
        getValidUtxo(new BigIntPr(VALID_AMOUNT)),
      ];

      const unsignedTx = newImportTx(
        {
          fromAddressesBytes,
          feeState,
          memo,
          sourceChainId: testContext.cBlockchainID,
          toAddressesBytes: [testAddress1],
          utxos,
        },
        testContext,
      );

      const { baseTx, ins: importedIns } = unsignedTx.getTx() as ImportTx;
      const { inputs, outputs, memo: txMemo } = baseTx;

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({
          unsignedTx,
          inputs,
          outputs,
          additionalInputs: importedIns,
          feeState,
        });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new ImportTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [
            TransferableOutput.fromNative(
              testContext.avaxAssetID,
              VALID_AMOUNT - expectedFee,
              [testAddress1],
            ),
          ],
          [],
          memo ?? new Uint8Array(),
        ),
        Id.fromString(testContext.cBlockchainID),
        [TransferableInput.fromUtxoAndSigindicies(utxos[2], [0])],
      );

      expectTxs(unsignedTx.getTx(), expectedTx);

      // Ensure that the unsigned tx utxos are the filtered utxos,
      // and not the inputUtxos registered in the spend helper.
      // This is only relevant for the ImportTx.
      expect(unsignedTx.utxos).toHaveLength(1);
      expect(unsignedTx.utxos).not.toContain(utxos[0]);
      expect(unsignedTx.utxos).not.toContain(utxos[1]);
    });

    test('newExportTx', () => {
      const VALID_AMOUNT = BigInt(50 * 1e9);
      const OUT_AMOUNT = BigInt(5 * 1e9);
      const utxos = [
        getLockedUTXO(),
        getNotTransferOutput(),
        getValidUtxo(new BigIntPr(VALID_AMOUNT)),
      ];
      const tnsOut = TransferableOutput.fromNative(
        testContext.avaxAssetID,
        OUT_AMOUNT,
        [toAddress],
      );

      const unsignedTx = newExportTx(
        {
          destinationChainId: testContext.cBlockchainID,
          feeState,
          fromAddressesBytes,
          memo,
          outputs: [tnsOut],
          utxos,
        },
        testContext,
      );

      const { baseTx, outs: exportedOuts } = unsignedTx.getTx() as ExportTx;
      const { inputs, outputs, memo: txMemo } = baseTx;

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({
          unsignedTx,
          inputs,
          outputs,
          additionalOutputs: exportedOuts,
          feeState,
        });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new ExportTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [
            TransferableOutput.fromNative(
              testContext.avaxAssetID,
              VALID_AMOUNT - OUT_AMOUNT - expectedFee,
              fromAddressesBytes,
            ),
          ],
          [getTransferableInputForTest()],
          memo ?? new Uint8Array(),
        ),
        Id.fromString(testContext.cBlockchainID),
        [tnsOut],
      );

      expectTxs(unsignedTx.getTx(), expectedTx);
    });

    test('newCreateSubnetTx', () => {
      const utxoInputAmt = BigInt(2 * 1e9);

      const unsignedTx = newCreateSubnetTx(
        {
          fromAddressesBytes,
          feeState,
          memo,
          subnetOwners: [toAddress],
          utxos: [getValidUtxo(new BigIntPr(utxoInputAmt))],
        },
        testContext,
      );

      const { baseTx } = unsignedTx.getTx() as PVMBaseTx;
      const { inputs, outputs, memo: txMemo } = baseTx;

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({ unsignedTx, inputs, outputs, feeState });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new CreateSubnetTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [getTransferableOutForTest(utxoInputAmt - expectedFee)],
          [getTransferableInputForTest(utxoInputAmt)],
          memo ?? new Uint8Array(),
        ),
        getRewardsOwners(),
      );

      expectTxs(unsignedTx.getTx(), expectedTx);
    });

    test('newCreateChainTx', () => {
      const utxoInputAmt = BigInt(2 * 1e9);

      const unsignedTx = newCreateChainTx(
        {
          chainName: 'Random Chain Name',
          feeState,
          fromAddressesBytes,
          fxIds: [],
          genesisData: testGenesisData,
          memo,
          subnetAuth: [0],
          subnetId: Id.fromHex(testSubnetId).toString(),
          utxos: [getValidUtxo(new BigIntPr(utxoInputAmt))],
          vmId: Id.fromHex(testVMId).toString(),
        },
        testContext,
      );

      const { baseTx } = unsignedTx.getTx() as PVMBaseTx;
      const { inputs, outputs, memo: txMemo } = baseTx;

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({ unsignedTx, inputs, outputs, feeState });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new CreateChainTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [getTransferableOutForTest(utxoInputAmt - expectedFee)],
          [getTransferableInputForTest(utxoInputAmt)],
          memo ?? new Uint8Array(),
        ),
        Id.fromHex(testSubnetId),
        new Stringpr('Random Chain Name'),
        Id.fromHex(testVMId),
        [],
        new Bytes(new TextEncoder().encode(JSON.stringify(testGenesisData))),
        Input.fromNative([0]),
      );

      expectTxs(unsignedTx.getTx(), expectedTx);
    });

    test('newAddSubnetValidatorTx', () => {
      const utxoInputAmt = BigInt(2 * 1e9);

      const unsignedTx = newAddSubnetValidatorTx(
        {
          end: 190_000_000n,
          feeState,
          fromAddressesBytes,
          nodeId,
          memo,
          subnetAuth: [0],
          subnetId: Id.fromHex(testSubnetId).toString(),
          start: 100n,
          utxos: [getValidUtxo(new BigIntPr(utxoInputAmt))],
          weight: 1_800_000n,
        },
        testContext,
      );

      const { baseTx } = unsignedTx.getTx() as PVMBaseTx;
      const { inputs, outputs, memo: txMemo } = baseTx;

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({ unsignedTx, inputs, outputs, feeState });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new AddSubnetValidatorTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [getTransferableOutForTest(utxoInputAmt - expectedFee)],
          [getTransferableInputForTest(utxoInputAmt)],
          memo ?? new Uint8Array(),
        ),
        SubnetValidator.fromNative(
          nodeId,
          100n,
          190_000_000n,
          1_800_000n,
          Id.fromHex(testSubnetId),
        ),
        Input.fromNative([0]),
      );

      expectTxs(unsignedTx.getTx(), expectedTx);
    });

    test('newRemoveSubnetValidatorTx', () => {
      const utxoInputAmt = BigInt(2 * 1e9);

      const unsignedTx = newRemoveSubnetValidatorTx(
        {
          fromAddressesBytes,
          feeState,
          nodeId,
          memo,
          subnetAuth: [0],
          subnetId: Id.fromHex(testSubnetId).toString(),
          utxos: [getValidUtxo(new BigIntPr(utxoInputAmt))],
        },
        testContext,
      );

      const { baseTx } = unsignedTx.getTx() as PVMBaseTx;
      const { inputs, outputs, memo: txMemo } = baseTx;

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({ unsignedTx, inputs, outputs, feeState });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new RemoveSubnetValidatorTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [getTransferableOutForTest(utxoInputAmt - expectedFee)],
          [getTransferableInputForTest(utxoInputAmt)],
          memo ?? new Uint8Array(),
        ),
        NodeId.fromString(nodeId),
        Id.fromHex(testSubnetId),
        Input.fromNative([0]),
      );

      expectTxs(unsignedTx.getTx(), expectedTx);
    });

    test('newAddPermissionlessValidatorTx - primary network', () => {
      const utxoInputAmt = AvaxToNAvax(2);
      const stakeAmount = 1_800_000n;

      const unsignedTx = newAddPermissionlessValidatorTx(
        {
          delegatorRewardsOwner: [],
          end: 120n,
          feeState,
          fromAddressesBytes,
          nodeId,
          memo,
          publicKey: blsPublicKeyBytes(),
          rewardAddresses: [],
          shares: 1,
          signature: blsSignatureBytes(),
          start: 0n,
          subnetId: PrimaryNetworkID.toString(),
          utxos: [getValidUtxo(new BigIntPr(utxoInputAmt))],
          weight: stakeAmount,
        },
        testContext,
      );

      const { baseTx, stake } =
        unsignedTx.getTx() as AddPermissionlessValidatorTx;
      const { inputs, outputs, memo: txMemo } = baseTx;

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({
          unsignedTx,
          inputs,
          outputs,
          additionalOutputs: stake,
          feeState,
        });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new AddPermissionlessValidatorTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [getTransferableOutForTest(utxoInputAmt - stakeAmount - expectedFee)],
          [getTransferableInputForTest(utxoInputAmt)],
          memo ?? new Uint8Array(),
        ),
        SubnetValidator.fromNative(
          NodeId.fromString(nodeId).toString(),
          0n,
          120n,
          stakeAmount,
          PrimaryNetworkID,
        ),
        new Signer(proofOfPossession()),
        [getTransferableOutForTest(stakeAmount)], //stake
        OutputOwners.fromNative([], 0n, 1),
        OutputOwners.fromNative([], 0n, 1),
        new Int(1),
      );

      expectTxs(unsignedTx.getTx(), expectedTx);
    });

    test('newAddPermissionlessValidatorTx - subnet', () => {
      const utxoInputAmt = AvaxToNAvax(2);
      const stakeAmount = 1_800_000n;

      const unsignedTx = newAddPermissionlessValidatorTx(
        {
          delegatorRewardsOwner: [],
          end: 120n,
          feeState,
          fromAddressesBytes,
          nodeId,
          memo,
          publicKey: blsPublicKeyBytes(),
          rewardAddresses: [],
          shares: 1,
          signature: blsSignatureBytes(),
          start: 0n,
          subnetId: Id.fromHex(testSubnetId).toString(),
          utxos: [getValidUtxo(new BigIntPr(utxoInputAmt))],
          weight: stakeAmount,
        },
        testContext,
      );

      const { baseTx, stake } =
        unsignedTx.getTx() as AddPermissionlessValidatorTx;
      const { inputs, outputs, memo: txMemo } = baseTx;

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({
          unsignedTx,
          inputs,
          outputs,
          additionalOutputs: stake,
          feeState,
        });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new AddPermissionlessValidatorTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [getTransferableOutForTest(utxoInputAmt - stakeAmount - expectedFee)],
          [getTransferableInputForTest(utxoInputAmt)],
          memo ?? new Uint8Array(),
        ),
        SubnetValidator.fromNative(
          NodeId.fromString(nodeId).toString(),
          0n,
          120n,
          stakeAmount,
          Id.fromHex(testSubnetId),
        ),
        new Signer(proofOfPossession()),
        [getTransferableOutForTest(stakeAmount)], //stake
        OutputOwners.fromNative([], 0n, 1),
        OutputOwners.fromNative([], 0n, 1),
        new Int(1),
      );

      expectTxs(unsignedTx.getTx(), expectedTx);
    });

    test('newAddPermissionlessValidatorTx - subnet with non avax staking token', () => {
      const utxoInputAmt = AvaxToNAvax(2);
      const stakingAssetId = Id.fromHex('0102');
      const stakeAmount = 1_000_000n;

      const unsignedTx = newAddPermissionlessValidatorTx(
        {
          delegatorRewardsOwner: [],
          end: 120n,
          feeState,
          fromAddressesBytes,
          nodeId,
          memo,
          publicKey: blsPublicKeyBytes(),
          rewardAddresses: [],
          shares: 1,
          signature: blsSignatureBytes(),
          stakingAssetId: stakingAssetId.toString(),
          start: 0n,
          subnetId: Id.fromHex(testSubnetId).toString(),
          utxos: [
            getValidUtxo(new BigIntPr(utxoInputAmt)),
            getValidUtxo(new BigIntPr(2n * stakeAmount), stakingAssetId),
          ],
          weight: stakeAmount,
        },
        testContext,
      );

      const { baseTx, stake } =
        unsignedTx.getTx() as AddPermissionlessValidatorTx;
      const { inputs, outputs, memo: txMemo } = baseTx;

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({
          unsignedTx,
          inputs,
          outputs,
          additionalOutputs: stake,
          feeState,
        });

      expect(stake.length).toEqual(1);
      // Expect correct stake out
      expect(stake[0].assetId.toString()).toEqual(stakingAssetId.toString());
      expect(stake[0].amount()).toEqual(stakeAmount);
      // Expect correct change utxos
      expect(outputs.length).toEqual(2);
      // Stake token change
      expect(outputs[0].assetId.toString()).toEqual(stakingAssetId.toString());
      expect(outputs[0].amount()).toEqual(stakeAmount);
      // AVAX Change
      expect(outputs[1].assetId.toString()).toEqual(testContext.avaxAssetID);
      expect(outputs[1].amount()).toEqual(utxoInputAmt - expectedFee);

      expect(amountConsumed).toEqual(expectedAmountConsumed);
    });

    test('newAddPermissionlessDelegator - primary network', () => {
      const utxoInputAmt = AvaxToNAvax(2);
      const stakeAmount = 1_800_000n;

      const unsignedTx = newAddPermissionlessDelegatorTx(
        {
          end: 120n,
          feeState,
          fromAddressesBytes,
          nodeId,
          memo,
          rewardAddresses: [],
          start: 0n,
          subnetId: PrimaryNetworkID.toString(),
          utxos: [getValidUtxo(new BigIntPr(utxoInputAmt))],
          weight: stakeAmount,
        },
        testContext,
      );

      const { baseTx, stake } =
        unsignedTx.getTx() as AddPermissionlessDelegatorTx;
      const { inputs, outputs, memo: txMemo } = baseTx;

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({
          unsignedTx,
          inputs,
          outputs,
          additionalOutputs: stake,
          feeState,
        });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new AddPermissionlessDelegatorTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [getTransferableOutForTest(utxoInputAmt - stakeAmount - expectedFee)],
          [getTransferableInputForTest(utxoInputAmt)],
          memo ?? new Uint8Array(),
        ),
        SubnetValidator.fromNative(
          NodeId.fromString(nodeId).toString(),
          0n,
          120n,
          stakeAmount,
          PrimaryNetworkID,
        ),
        [getTransferableOutForTest(stakeAmount)], //stake
        OutputOwners.fromNative([], 0n, 1),
      );

      expectTxs(unsignedTx.getTx(), expectedTx);
    });

    test('newAddPermissionlessDelegator - subnet', () => {
      const utxoInputAmt = AvaxToNAvax(2);
      const stakeAmount = 1_800_000n;

      const unsignedTx = newAddPermissionlessDelegatorTx(
        {
          end: 120n,
          feeState,
          fromAddressesBytes,
          nodeId,
          memo,
          rewardAddresses: [],
          start: 0n,
          subnetId: Id.fromHex(testSubnetId).toString(),
          utxos: [getValidUtxo(new BigIntPr(utxoInputAmt))],
          weight: stakeAmount,
        },
        testContext,
      );

      const { baseTx, stake } =
        unsignedTx.getTx() as AddPermissionlessDelegatorTx;
      const { inputs, outputs, memo: txMemo } = baseTx;

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({
          unsignedTx,
          inputs,
          outputs,
          additionalOutputs: stake,
          feeState,
        });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new AddPermissionlessDelegatorTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [getTransferableOutForTest(utxoInputAmt - stakeAmount - expectedFee)],
          [getTransferableInputForTest(utxoInputAmt)],
          memo ?? new Uint8Array(),
        ),
        SubnetValidator.fromNative(
          NodeId.fromString(nodeId).toString(),
          0n,
          120n,
          stakeAmount,
          Id.fromHex(testSubnetId),
        ),
        [getTransferableOutForTest(stakeAmount)], //stake
        OutputOwners.fromNative([], 0n, 1),
      );

      expectTxs(unsignedTx.getTx(), expectedTx);
    });

    test('newAddPermissionlessDelegator - subnet with non avax staking token', () => {
      const utxoInputAmt = AvaxToNAvax(2);
      const stakingAssetId = Id.fromHex('0102');
      const stakeAmount = 1_000_000n;

      const unsignedTx = newAddPermissionlessDelegatorTx(
        {
          end: 120n,
          feeState,
          fromAddressesBytes,
          nodeId,
          memo,
          rewardAddresses: [],
          stakingAssetId: stakingAssetId.toString(),
          start: 0n,
          subnetId: Id.fromHex(testSubnetId).toString(),
          utxos: [
            getValidUtxo(new BigIntPr(utxoInputAmt)),
            getValidUtxo(new BigIntPr(2n * stakeAmount), stakingAssetId),
          ],
          weight: stakeAmount,
        },
        testContext,
      );

      const { baseTx, stake } =
        unsignedTx.getTx() as AddPermissionlessDelegatorTx;
      const { inputs, outputs, memo: txMemo } = baseTx;

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({
          unsignedTx,
          inputs,
          outputs,
          additionalOutputs: stake,
          feeState,
        });

      expect(stake.length).toEqual(1);
      // Expect correct stake out
      expect(stake[0].assetId.toString()).toEqual(stakingAssetId.toString());
      expect(stake[0].amount()).toEqual(stakeAmount);
      // Expect correct change utxos
      expect(outputs.length).toEqual(2);
      // Stake token change
      expect(outputs[0].assetId.toString()).toEqual(stakingAssetId.toString());
      expect(outputs[0].amount()).toEqual(stakeAmount);
      // AVAX Change
      expect(outputs[1].assetId.toString()).toEqual(testContext.avaxAssetID);
      expect(outputs[1].amount()).toEqual(utxoInputAmt - expectedFee);

      expect(amountConsumed).toEqual(expectedAmountConsumed);
    });

    test('newTransferSubnetOwnershipTx', () => {
      const utxoInputAmt = BigInt(2 * 1e9);
      const subnetAuth = [0, 1];

      const unsignedTx = newTransferSubnetOwnershipTx(
        {
          fromAddressesBytes,
          feeState,
          memo,
          subnetAuth,
          subnetId: Id.fromHex(testSubnetId).toString(),
          subnetOwners: [toAddress],
          utxos: [getValidUtxo(new BigIntPr(utxoInputAmt))],
        },
        testContext,
      );

      const { baseTx } = unsignedTx.getTx() as PVMBaseTx;
      const { inputs, outputs, memo: txMemo } = baseTx;

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({ unsignedTx, inputs, outputs, feeState });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new TransferSubnetOwnershipTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [getTransferableOutForTest(utxoInputAmt - expectedFee)],
          [getTransferableInputForTest(utxoInputAmt)],
          memo ?? new Uint8Array(),
        ),
        Id.fromHex(testSubnetId),
        Input.fromNative(subnetAuth),
        getRewardsOwners(),
      );

      expectTxs(unsignedTx.getTx(), expectedTx);
    });
  });

  describe('ImportTx', () => {
    it('should create an ImportTx with only AVAX and not non-AVAX assets', () => {
      const utxos = [
        getLockedUTXO(), // Locked and should be ignored.
        getNotTransferOutput(), // Invalid and should be ignored.
        // AVAX Assets
        getValidUtxo(new BigIntPr(BigInt(35 * 1e9)), testAvaxAssetID),
        getValidUtxo(new BigIntPr(BigInt(28 * 1e9)), testAvaxAssetID),
        // Non-AVAX Assets (Jupiter)
        getValidUtxo(new BigIntPr(BigInt(15 * 1e9)), Id.fromString('jupiter')),
        getValidUtxo(new BigIntPr(BigInt(11 * 1e9)), Id.fromString('jupiter')),
        // Non-AVAX Asset (Mars)
        getValidUtxo(new BigIntPr(BigInt(9 * 1e9)), Id.fromString('mars')),
      ];

      const unsignedTx = newImportTx(
        {
          fromAddressesBytes,
          feeState,
          sourceChainId: testContext.cBlockchainID,
          toAddressesBytes: [testAddress1],
          utxos,
        },
        testContext,
      );

      const { baseTx, ins: importedIns } = unsignedTx.getTx() as ImportTx;
      const { inputs, outputs } = baseTx;

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({
          unsignedTx,
          inputs,
          outputs,
          additionalInputs: importedIns,
          feeState,
        });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new ImportTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [
            // Only AVAX asset here.
            // _If_ we did p-chain did support other assets, they would come first,
            // sorted by TransferableInput.compare.
            TransferableOutput.fromNative(
              testContext.avaxAssetID,
              BigInt((35 + 28) * 1e9) - expectedFee,
              [testAddress1],
            ),
          ],
          [],
          new Uint8Array(),
        ),
        Id.fromString(testContext.cBlockchainID),
        [
          TransferableInput.fromUtxoAndSigindicies(utxos[2], [0]),
          TransferableInput.fromUtxoAndSigindicies(utxos[3], [0]),
        ],
      );

      expectTxs(unsignedTx.getTx(), expectedTx);
    });
  });

  describe('ConvertSubnetToL1Tx', () => {
    it('should create an ConvertSubnetToL1Tx', () => {
      const utxoInputAmt = BigInt(50 * 1e9);
      const utxos = testUtxos();
      const signer = new ProofOfPossession(
        blsPublicKeyBytes(),
        blsSignatureBytes(),
      );
      const pChainOwner = PChainOwner.fromNative([testAddress1], 1);
      const validatorBalanceAmount = BigInt(1 * 1e9);

      const validator = L1Validator.fromNative(
        nodeId,
        BigInt(1 * 1e9),
        validatorBalanceAmount,
        signer,
        pChainOwner,
        pChainOwner,
      );

      const unsignedTx = newConvertSubnetToL1Tx(
        {
          fromAddressesBytes,
          feeState,
          utxos,
          subnetAuth: [0],
          subnetId: Id.fromHex(testSubnetId).toString(),
          address: testAddress1,
          validators: [validator],
          chainId: 'h5vH4Zz53MTN2jf72axZCfo1VbG1cMR6giR4Ra2TTpEmqxDWB',
        },
        testContext,
      );

      const { baseTx } = unsignedTx.getTx() as ConvertSubnetToL1Tx;
      const { inputs, outputs } = baseTx;

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({
          unsignedTx,
          inputs,
          outputs,
          feeState,
          additionalFee: validatorBalanceAmount,
        });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new ConvertSubnetToL1Tx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [getTransferableOutForTest(utxoInputAmt - expectedFee)],
          [getTransferableInputForTest(utxoInputAmt)],
          new Uint8Array(),
        ),
        Id.fromHex(testSubnetId),
        Id.fromString('h5vH4Zz53MTN2jf72axZCfo1VbG1cMR6giR4Ra2TTpEmqxDWB'),
        new Bytes(testAddress1),
        [validator],
        Input.fromNative([0]),
      );
      expectTxs(unsignedTx.getTx(), expectedTx);
    });

    it('should throw error if weight on a validator is 0', () => {
      const validator = L1Validator.fromNative(
        nodeId,
        BigInt(0 * 1e9),
        BigInt(0 * 1e9),
        new ProofOfPossession(blsPublicKeyBytes(), blsSignatureBytes()),
        PChainOwner.fromNative([testAddress1], 1),
        PChainOwner.fromNative([testAddress1], 1),
      );
      const utxos = testUtxos();
      try {
        newConvertSubnetToL1Tx(
          {
            fromAddressesBytes,
            feeState,
            utxos,
            subnetAuth: [0],
            subnetId: Id.fromHex(testSubnetId).toString(),
            address: testAddress1,
            validators: [validator],
            chainId: 'h5vH4Zz53MTN2jf72axZCfo1VbG1cMR6giR4Ra2TTpEmqxDWB',
          },
          testContext,
        );
      } catch (error) {
        expect((error as Error).message).toEqual(
          'Validator weight must be greater than 0',
        );
      }
    });
  });

  describe('RegisterL1ValidatorTx', () => {
    it('should create a RegisterL1ValidatorTx', () => {
      const balance = BigInt(10 * 1e9);
      const signatureBytes = blsSignatureBytes();
      const message = warpMessageBytes();

      const validUtxoAmount = BigInt(30 * 1e9);
      const utxos = [
        getValidUtxo(new BigIntPr(validUtxoAmount), testAvaxAssetID),
      ];

      const unsignedTx = newRegisterL1ValidatorTx(
        {
          balance,
          blsSignature: signatureBytes,
          fromAddressesBytes,
          feeState,
          message,
          utxos,
        },
        testContext,
      );

      const { baseTx } = unsignedTx.getTx() as SetL1ValidatorWeightTx;
      const { inputs, outputs } = baseTx;

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({
          unsignedTx,
          inputs,
          outputs,
          feeState,
          additionalFee: balance,
        });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new RegisterL1ValidatorTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [getTransferableOutForTest(validUtxoAmount - expectedFee)],
          [getTransferableInputForTest(validUtxoAmount)],
          new Uint8Array(),
        ),
        new BigIntPr(balance),
        BlsSignature.fromSignatureBytes(signatureBytes),
        new Bytes(message),
      );

      expectTxs(unsignedTx.getTx(), expectedTx);
    });
  });

  describe('SetL1ValidatorWeightTx', () => {
    it('should create a SetL1ValidatorWeightTx', () => {
      // Example Warp Message
      const message = warpMessageBytes();

      const validUtxoAmount = BigInt(30 * 1e9);
      const utxos = [
        getValidUtxo(new BigIntPr(validUtxoAmount), testAvaxAssetID),
      ];

      const unsignedTx = newSetL1ValidatorWeightTx(
        {
          fromAddressesBytes,
          feeState,
          message,
          utxos,
        },
        testContext,
      );

      const { baseTx } = unsignedTx.getTx() as SetL1ValidatorWeightTx;
      const { inputs, outputs } = baseTx;

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({
          unsignedTx,
          inputs,
          outputs,
          feeState,
        });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new SetL1ValidatorWeightTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [getTransferableOutForTest(validUtxoAmount - expectedFee)],
          [getTransferableInputForTest(validUtxoAmount)],
          new Uint8Array(),
        ),
        new Bytes(message),
      );

      expectTxs(unsignedTx.getTx(), expectedTx);
    });
  });

  describe('IncreaseL1ValidatorBalanceTx', () => {
    it('should create an IncreaseL1ValidatorBalanceTx', () => {
      const validUtxoAmount = BigInt(30 * 1e9);
      const balance = BigInt(1 * 1e9);
      const validationId = 'test';

      const utxos = [
        getLockedUTXO(), // Locked and should be ignored.
        getNotTransferOutput(), // Invalid and should be ignored.
        // AVAX Assets
        getValidUtxo(new BigIntPr(validUtxoAmount), testAvaxAssetID),
        // Non-AVAX Assets (Jupiter)
        getValidUtxo(new BigIntPr(BigInt(15 * 1e9)), Id.fromString('jupiter')),
        getValidUtxo(new BigIntPr(BigInt(11 * 1e9)), Id.fromString('jupiter')),
        // Non-AVAX Asset (Mars)
        getValidUtxo(new BigIntPr(BigInt(9 * 1e9)), Id.fromString('mars')),
      ];

      const unsignedTx = newIncreaseL1ValidatorBalanceTx(
        {
          balance,
          fromAddressesBytes,
          feeState,
          utxos,
          validationId,
        },
        testContext,
      );

      const { baseTx } = unsignedTx.getTx() as IncreaseL1ValidatorBalanceTx;
      const { inputs, outputs } = baseTx;

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({
          unsignedTx,
          inputs,
          outputs,
          feeState,
          additionalFee: balance,
        });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new IncreaseL1ValidatorBalanceTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [getTransferableOutForTest(validUtxoAmount - expectedFee)],
          [getTransferableInputForTest(validUtxoAmount)],
          new Uint8Array(),
        ),
        Id.fromString(validationId),
        new BigIntPr(balance),
      );
      expectTxs(unsignedTx.getTx(), expectedTx);
    });
  });

  it('should throw an error if the balance is less than or equal to 0', () => {
    const validationId = 'test';
    const utxos = testUtxos();

    expect(() => {
      newIncreaseL1ValidatorBalanceTx(
        {
          balance: 0n,
          fromAddressesBytes,
          feeState,
          utxos,
          validationId,
        },
        testContext,
      );
    }).toThrow('Balance must be greater than 0');

    expect(() => {
      newIncreaseL1ValidatorBalanceTx(
        {
          balance: -1n,
          fromAddressesBytes,
          feeState,
          utxos,
          validationId,
        },
        testContext,
      );
    }).toThrow('Balance must be greater than 0');
  });

  describe('DisableL1ValidatorTx', () => {
    it('should create a DisabledSubnetValidatorTx', () => {
      const validUtxoAmount = BigInt(30 * 1e9);
      const validationId = 'test';

      const utxos = [
        getLockedUTXO(), // Locked and should be ignored.
        getNotTransferOutput(), // Invalid and should be ignored.
        // AVAX Assets
        getValidUtxo(new BigIntPr(validUtxoAmount), testAvaxAssetID),
        // Non-AVAX Assets (Jupiter)
        getValidUtxo(new BigIntPr(BigInt(15 * 1e9)), Id.fromString('jupiter')),
        getValidUtxo(new BigIntPr(BigInt(11 * 1e9)), Id.fromString('jupiter')),
        // Non-AVAX Asset (Mars)
        getValidUtxo(new BigIntPr(BigInt(9 * 1e9)), Id.fromString('mars')),
      ];

      const unsignedTx = newDisableL1ValidatorTx(
        {
          disableAuth: [0],
          fromAddressesBytes,
          feeState,
          utxos,
          validationId,
        },
        testContext,
      );

      const { baseTx } = unsignedTx.getTx() as DisableL1ValidatorTx;
      const { inputs, outputs } = baseTx;

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({
          unsignedTx,
          inputs,
          outputs,
          feeState,
        });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new DisableL1ValidatorTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [getTransferableOutForTest(validUtxoAmount - expectedFee)],
          [getTransferableInputForTest(validUtxoAmount)],
          new Uint8Array(),
        ),
        Id.fromString(validationId),
        Input.fromNative([0]),
      );
      expectTxs(unsignedTx.getTx(), expectedTx);
    });
  });
});
