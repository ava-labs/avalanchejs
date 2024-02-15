import { testContext } from '../../fixtures/context';
import {
  fromAddressBytes,
  getBaseTxForTest,
  getStakeableLockedTransferableInputForTest,
  getStakeableLockedTransferableOutForTest,
  getTransferableInputForTest,
  getTransferableOutForTest,
  getValidUtxo,
  testAvaxAssetID,
  testGenesisData,
  testOwnerXAddress,
  testSubnetId,
  testUTXOID1,
  testUtxos,
  testVMId,
} from '../../fixtures/transactions';
import { expectTxs } from '../../fixtures/utils/expectTx';
import { testAddress1 } from '../../fixtures/vms';
import {
  BaseTx as AvaxBaseTx,
  TransferableInput,
  TransferableOutput,
  UTXOID,
} from '../../serializable/avax';
import { Utxo } from '../../serializable/avax/utxo';
import { Id } from '../../serializable/fxs/common';
import {
  Input,
  OutputOwners,
  TransferInput,
  TransferOutput,
} from '../../serializable/fxs/secp256k1';
import {
  BigIntPr,
  Byte,
  Bytes,
  Int,
  Stringpr,
} from '../../serializable/primitives';
import type { BaseTx } from '../../serializable/pvm';
import {
  AddDelegatorTx,
  AddPermissionlessDelegatorTx,
  AddPermissionlessValidatorTx,
  AddSubnetValidatorTx,
  AddValidatorTx,
  CreateChainTx,
  CreateSubnetTx,
  ExportTx,
  ImportTx,
  Signer,
  StakeableLockOut,
  SubnetValidator,
  TransferSubnetOwnershipTx,
  TransformSubnetTx,
  Validator,
} from '../../serializable/pvm';
import { hexToBuffer } from '../../utils';
import {
  newAddDelegatorTx,
  newAddPermissionlessValidatorTx,
  newAddSubnetValidatorTx,
  newAddValidatorTx,
  newCreateBlockchainTx,
  newCreateSubnetTx,
  newExportTx,
  newImportTx,
  newRemoveSubnetValidatorTx,
  newAddPermissionlessDelegatorTx,
  newBaseTx,
  newTransferSubnetOwnershipTx,
  newTransformSubnetTx,
} from './builder';
import { RemoveSubnetValidatorTx } from '../../serializable/pvm/removeSubnetValidatorTx';
import { NodeId } from '../../serializable/fxs/common/nodeId';
import { proofOfPossession } from '../../fixtures/pvm';
import {
  blsPublicKeyBytes,
  blsSignatureBytes,
} from '../../fixtures/primitives';
import { AvaxToNAvax } from '../../utils/avaxToNAvax';
import { PrimaryNetworkID } from '../../constants/networkIDs';

describe('pvmBuilder', () => {
  const nodeID = 'NodeID-2m38qc95mhHXtrhjyGbe7r2NhniqHHJRB';
  const toAddress = hexToBuffer('0x5432112345123451234512');

  const getRewardsOwners = () => OutputOwners.fromNative([toAddress]);

  it('baseTx', () => {
    const utxos = testUtxos();
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
      AvaxBaseTx.fromNative(
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
      AvaxBaseTx.fromNative(
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

  it('AddValidatorTx - stakeable locked', () => {
    const utxos = testUtxos();
    const lockTime = BigInt(Math.floor(new Date().getTime() / 1000)) + 10000n;
    const lockedUtxo = new Utxo(
      new UTXOID(testUTXOID1, new Int(0)),
      testAvaxAssetID,
      new StakeableLockOut(
        new BigIntPr(lockTime),
        new TransferOutput(
          new BigIntPr(BigInt(50 * 1e9)),
          OutputOwners.fromNative([testOwnerXAddress.toBytes()]),
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
      AvaxBaseTx.fromNative(
        testContext.networkID,
        testContext.pBlockchainID,
        [getStakeableLockedTransferableOutForTest(49000000000n, lockTime)],
        [getStakeableLockedTransferableInputForTest(50000000000n, lockTime)],
        new Uint8Array(),
      ),
      Validator.fromNative(nodeID, 100n, 200n, BigInt(1e9)),
      [getStakeableLockedTransferableOutForTest(1000000000n, lockTime)],
      getRewardsOwners(),
      new Int(30 * 10000),
    );

    expectTxs(unsignedTx.getTx(), expectedTx);
  });

  it('AddDelegatorTx', () => {
    const utxos = testUtxos();
    const lockTime = BigInt(Math.floor(new Date().getTime() / 1000)) + 10000n;
    const lockedUtxo = new Utxo(
      new UTXOID(testUTXOID1, new Int(0)),
      testAvaxAssetID,
      new StakeableLockOut(
        new BigIntPr(lockTime),
        new TransferOutput(
          new BigIntPr(BigInt(50 * 1e9)),
          OutputOwners.fromNative([testOwnerXAddress.toBytes()]),
        ),
      ),
    );

    utxos.push(lockedUtxo);

    const unsignedTx = newAddDelegatorTx(
      testContext,
      utxos,
      fromAddressBytes,
      nodeID,
      100n,
      200n,
      BigInt(1e9),
      [toAddress],
    );

    const expectedTx = new AddDelegatorTx(
      AvaxBaseTx.fromNative(
        testContext.networkID,
        testContext.pBlockchainID,
        [getStakeableLockedTransferableOutForTest(49000000000n, lockTime)],
        [getStakeableLockedTransferableInputForTest(50000000000n, lockTime)],
        new Uint8Array(),
      ),
      Validator.fromNative(nodeID, 100n, 200n, BigInt(1e9)),
      [getStakeableLockedTransferableOutForTest(1000000000n, lockTime)],
      getRewardsOwners(),
    );

    expectTxs(unsignedTx.getTx(), expectedTx);
  });

  it('AddDelegatorTx - stakeable locked', () => {
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

  it('newCreateSubnetTx', () => {
    const utxoInputAmt = BigInt(2 * 1e9);
    const unsignedTx = newCreateSubnetTx(
      testContext,
      [getValidUtxo(new BigIntPr(utxoInputAmt))],
      fromAddressBytes,
      [toAddress],
    );

    const expectedTx = new CreateSubnetTx(
      AvaxBaseTx.fromNative(
        testContext.networkID,
        testContext.pBlockchainID,
        [
          getTransferableOutForTest(
            utxoInputAmt - testContext.createSubnetTxFee,
          ),
        ],
        [getTransferableInputForTest(utxoInputAmt)],
        new Uint8Array(),
      ),
      getRewardsOwners(),
    );

    expectTxs(unsignedTx.getTx(), expectedTx);
  });

  it('newCreateBlockchainTx', () => {
    const utxoInputAmt = BigInt(2 * 1e9);
    const unsignedTx = newCreateBlockchainTx(
      testContext,
      [getValidUtxo(new BigIntPr(utxoInputAmt))],
      fromAddressBytes,
      Id.fromHex(testSubnetId).toString(),
      'Random Chain Name',
      Id.fromHex(testVMId).toString(),
      [],
      testGenesisData,
      [0],
    );

    const expectedTx = new CreateChainTx(
      AvaxBaseTx.fromNative(
        testContext.networkID,
        testContext.pBlockchainID,
        [
          getTransferableOutForTest(
            utxoInputAmt - testContext.createBlockchainTxFee,
          ),
        ],
        [getTransferableInputForTest(utxoInputAmt)],
        new Uint8Array(),
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

  it('newCreateSubnetValidatorTx', () => {
    const utxoInputAmt = BigInt(2 * 1e9);
    const unsignedTx = newAddSubnetValidatorTx(
      testContext,
      [getValidUtxo(new BigIntPr(utxoInputAmt))],
      fromAddressBytes,
      nodeID,
      100n,
      190000000n,
      1800000n,
      Id.fromHex(testSubnetId).toString(),
      [0],
    );

    const expectedTx = new AddSubnetValidatorTx(
      AvaxBaseTx.fromNative(
        testContext.networkID,
        testContext.pBlockchainID,
        [getTransferableOutForTest(utxoInputAmt - testContext.baseTxFee)],
        [getTransferableInputForTest(utxoInputAmt)],
        new Uint8Array(),
      ),
      SubnetValidator.fromNative(
        nodeID,
        100n,
        190000000n,
        1800000n,
        Id.fromHex(testSubnetId),
      ),
      Input.fromNative([0]),
    );

    expectTxs(unsignedTx.getTx(), expectedTx);
  });

  it('newRemoveSubnetValidatorTx', () => {
    const utxoInputAmt = BigInt(2 * 1e9);
    const unsignedTx = newRemoveSubnetValidatorTx(
      testContext,
      [getValidUtxo(new BigIntPr(utxoInputAmt))],
      fromAddressBytes,
      nodeID,
      Id.fromHex(testSubnetId).toString(),
      [0],
    );

    const expectedTx = new RemoveSubnetValidatorTx(
      AvaxBaseTx.fromNative(
        testContext.networkID,
        testContext.pBlockchainID,
        [getTransferableOutForTest(utxoInputAmt - testContext.baseTxFee)],
        [getTransferableInputForTest(utxoInputAmt)],
        new Uint8Array(),
      ),
      NodeId.fromString(nodeID),
      Id.fromHex(testSubnetId),
      Input.fromNative([0]),
    );

    expectTxs(unsignedTx.getTx(), expectedTx);
  });

  it('newAddPermissionlessValidatorTx - primary network', () => {
    const utxoInputAmt = AvaxToNAvax(2);

    const unsignedTx = newAddPermissionlessValidatorTx(
      testContext,
      [getValidUtxo(new BigIntPr(utxoInputAmt))],
      fromAddressBytes,
      nodeID,
      PrimaryNetworkID.toString(),
      0n, // startTime
      120n, //end time
      1800000n, // weight
      [], // rewards owners
      [], // delegatorRewardsOwner
      1,
      {},
      1,
      0n,
      blsPublicKeyBytes(),
      blsSignatureBytes(),
    );

    const expectedTx = new AddPermissionlessValidatorTx(
      AvaxBaseTx.fromNative(
        testContext.networkID,
        testContext.pBlockchainID,
        [
          getTransferableOutForTest(
            utxoInputAmt - 1800000n - testContext.addPrimaryNetworkValidatorFee,
          ),
        ],
        [getTransferableInputForTest(utxoInputAmt)],
        new Uint8Array(),
      ),
      SubnetValidator.fromNative(
        NodeId.fromString(nodeID).toString(),
        0n,
        120n,
        1800000n,
        PrimaryNetworkID,
      ),
      new Signer(proofOfPossession()),
      [getTransferableOutForTest(1800000n)], //stake
      OutputOwners.fromNative([], 0n, 1),
      OutputOwners.fromNative([], 0n, 1),
      new Int(1),
    );

    expectTxs(unsignedTx.getTx(), expectedTx);
  });

  it('newAddPermissionlessValidatorTx - subnet', () => {
    const utxoInputAmt = AvaxToNAvax(2);

    const unsignedTx = newAddPermissionlessValidatorTx(
      testContext,
      [getValidUtxo(new BigIntPr(utxoInputAmt))],
      fromAddressBytes,
      nodeID,
      Id.fromHex(testSubnetId).toString(),
      0n, // startTime
      120n, //end time
      1800000n, // weight
      [], // rewards owners
      [], // delegatorRewardsOwner
      1,
      {},
      1,
      0n,
      blsPublicKeyBytes(),
      blsSignatureBytes(),
    );

    const expectedTx = new AddPermissionlessValidatorTx(
      AvaxBaseTx.fromNative(
        testContext.networkID,
        testContext.pBlockchainID,
        [
          getTransferableOutForTest(
            utxoInputAmt - 1800000n - testContext.addSubnetValidatorFee,
          ),
        ],
        [getTransferableInputForTest(utxoInputAmt)],
        new Uint8Array(),
      ),
      SubnetValidator.fromNative(
        NodeId.fromString(nodeID).toString(),
        0n,
        120n,
        1800000n,
        Id.fromHex(testSubnetId),
      ),
      new Signer(proofOfPossession()),
      [getTransferableOutForTest(1800000n)], //stake
      OutputOwners.fromNative([], 0n, 1),
      OutputOwners.fromNative([], 0n, 1),
      new Int(1),
    );

    expectTxs(unsignedTx.getTx(), expectedTx);
  });

  it('newAddPermissionlessValidatorTx - subnet with non avax staking token', () => {
    const utxoInputAmt = AvaxToNAvax(2);
    const stakingAssetId = Id.fromHex('0102');
    const stakeAmount = 1_000_000n;

    const unsignedTx = newAddPermissionlessValidatorTx(
      testContext,
      [
        getValidUtxo(new BigIntPr(utxoInputAmt)),
        getValidUtxo(new BigIntPr(2n * stakeAmount), stakingAssetId),
      ],
      fromAddressBytes,
      nodeID,
      Id.fromHex(testSubnetId).toString(),
      0n, // startTime
      120n, //end time
      stakeAmount, // weight
      [], // rewards owners
      [], // delegatorRewardsOwner
      1,
      {},
      1,
      0n,
      blsPublicKeyBytes(),
      blsSignatureBytes(),
      stakingAssetId.toString(),
    );

    const baseOuts = (unsignedTx.getTx() as AddPermissionlessValidatorTx).baseTx
      .outputs;
    const stakeUtxos = (unsignedTx.getTx() as AddPermissionlessValidatorTx)
      .stake;
    expect(stakeUtxos.length).toEqual(1);
    // Expect correct stake out
    expect(stakeUtxos[0].assetId.toString()).toEqual(stakingAssetId.toString());
    expect(stakeUtxos[0].amount()).toEqual(stakeAmount);
    // Expect correct change utxos
    expect(baseOuts.length).toEqual(2);
    // Stake token change
    expect(baseOuts[0].assetId.toString()).toEqual(stakingAssetId.toString());
    expect(baseOuts[0].amount()).toEqual(stakeAmount);
    // AVAX Change
    expect(baseOuts[1].assetId.toString()).toEqual(testContext.avaxAssetID);
    expect(baseOuts[1].amount().toString()).toEqual(
      (utxoInputAmt - testContext.addSubnetValidatorFee).toString(),
    );
  });

  it('newAddPermissionlessDelegatorTx - primary network', () => {
    const utxoInputAmt = AvaxToNAvax(2);

    const unsignedTx = newAddPermissionlessDelegatorTx(
      testContext,
      [getValidUtxo(new BigIntPr(utxoInputAmt))],
      fromAddressBytes,
      nodeID,
      PrimaryNetworkID.toString(),
      0n, // startTime
      120n, //end time
      1800000n, // weight
      [], // rewards owners
      {},
      1,
      0n,
    );

    const expectedTx = new AddPermissionlessDelegatorTx(
      AvaxBaseTx.fromNative(
        testContext.networkID,
        testContext.pBlockchainID,
        [
          getTransferableOutForTest(
            utxoInputAmt - 1800000n - testContext.addPrimaryNetworkDelegatorFee,
          ),
        ],
        [getTransferableInputForTest(utxoInputAmt)],
        new Uint8Array(),
      ),
      SubnetValidator.fromNative(
        NodeId.fromString(nodeID).toString(),
        0n,
        120n,
        1800000n,
        PrimaryNetworkID,
      ),
      [getTransferableOutForTest(1800000n)], //stake
      OutputOwners.fromNative([], 0n, 1),
    );

    expectTxs(unsignedTx.getTx(), expectedTx);
  });

  it('newAddPermissionlessDelegatorTx - subnet', () => {
    const utxoInputAmt = AvaxToNAvax(2);

    const unsignedTx = newAddPermissionlessDelegatorTx(
      testContext,
      [getValidUtxo(new BigIntPr(utxoInputAmt))],
      fromAddressBytes,
      nodeID,
      Id.fromHex(testSubnetId).toString(),
      0n, // startTime
      120n, //end time
      1800000n, // weight
      [], // rewards owners
      {},
      1,
      0n,
    );

    const expectedTx = new AddPermissionlessDelegatorTx(
      AvaxBaseTx.fromNative(
        testContext.networkID,
        testContext.pBlockchainID,
        [
          getTransferableOutForTest(
            utxoInputAmt - 1800000n - testContext.addSubnetDelegatorFee,
          ),
        ],
        [getTransferableInputForTest(utxoInputAmt)],
        new Uint8Array(),
      ),
      SubnetValidator.fromNative(
        NodeId.fromString(nodeID).toString(),
        0n,
        120n,
        1800000n,
        Id.fromHex(testSubnetId),
      ),
      [getTransferableOutForTest(1800000n)], //stake
      OutputOwners.fromNative([], 0n, 1),
    );

    expectTxs(unsignedTx.getTx(), expectedTx);
  });

  it('newAddPermissionlessDelegatorTx - subnet with non avax staking token', () => {
    const utxoInputAmt = AvaxToNAvax(2);
    const stakingAssetId = Id.fromHex('0102');
    const stakeAmount = 1_000_000n;

    const unsignedTx = newAddPermissionlessDelegatorTx(
      testContext,
      [
        getValidUtxo(new BigIntPr(utxoInputAmt)),
        getValidUtxo(new BigIntPr(2n * stakeAmount), stakingAssetId),
      ],
      fromAddressBytes,
      nodeID,
      Id.fromHex(testSubnetId).toString(),
      0n, // startTime
      120n, //end time
      stakeAmount, // weight
      [], // rewards owners
      {},
      1,
      0n,
      stakingAssetId.toString(),
    );

    const baseOuts = (unsignedTx.getTx() as AddPermissionlessDelegatorTx).baseTx
      .outputs;
    const stakeUtxos = (unsignedTx.getTx() as AddPermissionlessDelegatorTx)
      .stake;

    expect(stakeUtxos.length).toEqual(1);
    // Expect correct stake out
    expect(stakeUtxos[0].assetId.toString()).toEqual(stakingAssetId.toString());
    expect(stakeUtxos[0].amount()).toEqual(stakeAmount);
    // Expect correct change utxos
    expect(baseOuts.length).toEqual(2);
    // Stake token change
    expect(baseOuts[0].assetId.toString()).toEqual(stakingAssetId.toString());
    expect(baseOuts[0].amount()).toEqual(stakeAmount);
    // AVAX Change
    expect(baseOuts[1].assetId.toString()).toEqual(testContext.avaxAssetID);
    expect(baseOuts[1].amount().toString()).toEqual(
      (utxoInputAmt - testContext.addSubnetDelegatorFee).toString(),
    );
  });

  it('newTransferSubnetOwnershipTx', () => {
    const utxoInputAmt = BigInt(2 * 1e9);
    const subnetAuth = [0, 1];
    const unsignedTx = newTransferSubnetOwnershipTx(
      testContext,
      [getValidUtxo(new BigIntPr(utxoInputAmt))],
      fromAddressBytes,
      Id.fromHex(testSubnetId).toString(),
      subnetAuth,
      [toAddress],
    );

    const expectedTx = new TransferSubnetOwnershipTx(
      AvaxBaseTx.fromNative(
        testContext.networkID,
        testContext.pBlockchainID,
        [getTransferableOutForTest(utxoInputAmt - testContext.baseTxFee)],
        [getTransferableInputForTest(utxoInputAmt)],
        new Uint8Array(),
      ),
      Id.fromHex(testSubnetId),
      Input.fromNative(subnetAuth),
      getRewardsOwners(),
    );

    expectTxs(unsignedTx.getTx(), expectedTx);
  });

  it('newTransformSubnetTx', () => {
    const utxoInputAmt = BigInt(2 * 1e12);
    const stakingAssetId = Id.fromHex('0102');
    const subnetAuth = [0, 1];

    const unsignedTx = newTransformSubnetTx(
      testContext,
      [getValidUtxo(new BigIntPr(utxoInputAmt))],
      fromAddressBytes,
      Id.fromHex(testSubnetId).toString(),
      stakingAssetId.toString(),
      1n,
      2n,
      3n,
      4n,
      5n,
      6n,
      1,
      2,
      3,
      4,
      5,
      6,
      subnetAuth,
    );

    const expectedTx = new TransformSubnetTx(
      AvaxBaseTx.fromNative(
        testContext.networkID,
        testContext.pBlockchainID,
        [
          getTransferableOutForTest(
            utxoInputAmt - testContext.transformSubnetTxFee,
          ),
        ],
        [getTransferableInputForTest(utxoInputAmt)],
        new Uint8Array(),
      ),
      Id.fromHex(testSubnetId),
      stakingAssetId,
      new BigIntPr(1n),
      new BigIntPr(2n),
      new BigIntPr(3n),
      new BigIntPr(4n),
      new BigIntPr(5n),
      new BigIntPr(6n),
      new Int(1),
      new Int(2),
      new Int(3),
      new Int(4),
      new Byte(hexToBuffer('0x5')),
      new Int(6),
      Input.fromNative(subnetAuth),
    );

    expectTxs(unsignedTx.getTx(), expectedTx);
  });
});
