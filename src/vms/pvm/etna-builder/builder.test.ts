import { testContext as _testContext } from '../../../fixtures/context';
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
} from '../../../serializable/pvm';
import { BaseTx as AvaxBaseTx } from '../../../serializable/avax';
import { hexToBuffer } from '../../../utils';
import type { UnsignedTx } from '../../common';
import { createDimensions } from '../../common/fees/dimensions';
import type { Context } from '../../context';
import { calculateFee } from '../txs/fee/calculator';
import {
  newAddPermissionlessDelegatorTx,
  newAddPermissionlessValidatorTx,
  newAddSubnetValidatorTx,
  newBaseTx,
  newCreateChainTx,
  newCreateSubnetTx,
  newExportTx,
  newImportTx,
  newRemoveSubnetValidatorTx,
  newTransferSubnetOwnershipTx,
} from './builder';
import { testAddress1 } from '../../../fixtures/vms';
import { AvaxToNAvax } from '../../../utils/avaxToNAvax';
import { PrimaryNetworkID } from '../../../constants/networkIDs';
import {
  blsPublicKeyBytes,
  blsSignatureBytes,
} from '../../../fixtures/primitives';
import { proofOfPossession } from '../../../fixtures/pvm';

const testContext: Context = {
  ..._testContext,

  // Required context for post-Etna
  gasPrice: 1n,
  complexityWeights: createDimensions(1, 10, 100, 1000),
};

const addTransferableAmounts = (
  transferableItems:
    | readonly TransferableOutput[]
    | readonly TransferableInput[],
): Map<string, bigint> => {
  const amounts = new Map<string, bigint>();

  for (const transferable of transferableItems) {
    const assetId = transferable.getAssetId();

    amounts.set(assetId, (amounts.get(assetId) ?? 0n) + transferable.amount());
  }

  return amounts;
};

const addAmounts = (...amounts: Map<string, bigint>[]): Map<string, bigint> => {
  const amount = new Map<string, bigint>();

  for (const m of amounts) {
    for (const [assetID, value] of m) {
      amount.set(assetID, (amount.get(assetID) ?? 0n) + value);
    }
  }

  return amount;
};

/**
 * Given a bigint, returns a human-readable string of the value.
 *
 * @example
 * ```ts
 * formatBigIntToHumanReadable(123456789n); // '123_456_789n'
 * formatBigIntToHumanReadable(1234567890n); // '1_234_567_890n'
 * ```
 */
const formatBigIntToHumanReadable = (value: bigint): string => {
  const bigIntStr = value.toString();

  return `${bigIntStr.replace(/\B(?=(\d{3})+(?!\d))/g, '_')}n`;
};

/**
 * Calculates the required fee for the unsigned transaction
 * and verifies that the burned amount is exactly the required fee.
 */
const checkFeeIsCorrect = ({
  unsignedTx,
  inputs,
  outputs,
  additionalInputs = [],
  additionalOutputs = [],
}: {
  unsignedTx: UnsignedTx;
  inputs: readonly TransferableInput[];
  outputs: readonly TransferableOutput[];
  additionalInputs?: readonly TransferableInput[];
  additionalOutputs?: readonly TransferableOutput[];
}): [
  amountConsumed: Record<string, string>,
  expectedAmountConsumed: Record<string, string>,
  expectedFee: bigint,
] => {
  const amountConsumed = addTransferableAmounts([
    ...inputs,
    ...additionalInputs,
  ]);
  const amountProduced = addTransferableAmounts([
    ...outputs,
    ...additionalOutputs,
  ]);

  const expectedFee = calculateFee(
    unsignedTx.getTx(),
    testContext.complexityWeights,
    testContext.gasPrice,
  );

  const expectedAmountBurned = addAmounts(
    new Map([[testAvaxAssetID.toString(), expectedFee]]),
  );

  const expectedAmountConsumed = addAmounts(
    amountProduced,
    expectedAmountBurned,
  );

  // Convert each map into a object with a stringified bigint value.
  const safeExpectedAmountConsumed = Object.fromEntries(
    [...expectedAmountConsumed].map(([k, v]) => [
      k,
      formatBigIntToHumanReadable(v),
    ]),
  );

  const safeAmountConsumed = Object.fromEntries(
    [...amountConsumed].map(([k, v]) => [k, formatBigIntToHumanReadable(v)]),
  );

  return [safeAmountConsumed, safeExpectedAmountConsumed, expectedFee];
};

describe('./src/vms/pvm/etna-builder/builder.test.ts', () => {
  const nodeId = 'NodeID-2m38qc95mhHXtrhjyGbe7r2NhniqHHJRB';
  const toAddress = hexToBuffer('0x5432112345123451234512');
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
          outputs: [transferableOutput],
          options: {
            memo,
          },
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
      });

      expect(amountConsumed).toEqual(expectedAmountConsumed);
    });

    test('newImportTx', () => {
      const utxos = testUtxos();

      const unsignedTx = newImportTx(
        {
          fromAddressesBytes,
          options: {
            memo,
          },
          sourceChainId: testContext.cBlockchainID,
          toAddresses: [testAddress1],
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
        });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new ImportTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [
            TransferableOutput.fromNative(
              testContext.avaxAssetID,
              // TODO: How to remove this "magic" number. How do we calculate it correctly from utxos?
              50_000_000_000n - expectedFee,
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
    });

    test('newExportTx', () => {
      const utxos = testUtxos();
      const tnsOut = TransferableOutput.fromNative(
        testContext.avaxAssetID,
        BigInt(5 * 1e9),
        [toAddress],
      );

      const unsignedTx = newExportTx(
        {
          destinationChainId: testContext.cBlockchainID,
          fromAddressesBytes,
          options: {
            memo,
          },
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
        });

      expect(amountConsumed).toEqual(expectedAmountConsumed);

      const expectedTx = new ExportTx(
        AvaxBaseTx.fromNative(
          testContext.networkID,
          testContext.pBlockchainID,
          [
            TransferableOutput.fromNative(
              testContext.avaxAssetID,
              // TODO: Remove magic number. How to calculate it correctly from utxos?
              45_000_000_000n - expectedFee,
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
          options: {
            memo,
          },
          subnetOwners: [toAddress],
          utxos: [getValidUtxo(new BigIntPr(utxoInputAmt))],
        },
        testContext,
      );

      const { baseTx } = unsignedTx.getTx() as PVMBaseTx;
      const { inputs, outputs, memo: txMemo } = baseTx;

      expect(txMemo.toString()).toEqual(memo ? 'memo' : '');

      const [amountConsumed, expectedAmountConsumed, expectedFee] =
        checkFeeIsCorrect({ unsignedTx, inputs, outputs });

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
          fromAddressesBytes,
          fxIds: [],
          genesisData: testGenesisData,
          options: {
            memo,
          },
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
        checkFeeIsCorrect({ unsignedTx, inputs, outputs });

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
          fromAddressesBytes,
          nodeId,
          options: {
            memo,
          },
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
        checkFeeIsCorrect({ unsignedTx, inputs, outputs });

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
          nodeId,
          options: {
            memo,
          },
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
        checkFeeIsCorrect({ unsignedTx, inputs, outputs });

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
          fromAddressesBytes,
          nodeId,
          options: {
            memo,
          },
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
          fromAddressesBytes,
          nodeId,
          options: {
            memo,
          },
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
          fromAddressesBytes,
          nodeId,
          options: {
            memo,
          },
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
          fromAddressesBytes,
          nodeId,
          options: {
            memo,
          },
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
          fromAddressesBytes,
          nodeId,
          options: {
            memo,
          },
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
          fromAddressesBytes,
          nodeId,
          options: {
            memo,
          },
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
          options: {
            memo,
          },
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
        checkFeeIsCorrect({ unsignedTx, inputs, outputs });

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
          sourceChainId: testContext.cBlockchainID,
          toAddresses: [testAddress1],
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
});
