import { describe, expect, it } from 'vitest';

import { testContext } from '../../../fixtures/context';
import { feeState } from '../../../fixtures/pvm';
import {
  blsPublicKeyBytes,
  blsSignatureBytes,
} from '../../../fixtures/primitives';
import { testOwnerXAddress, testUTXOID3 } from '../../../fixtures/transactions';
import { testAddress1, testAddress2 } from '../../../fixtures/vms';
import { PrimaryNetworkID } from '../../../constants/networkIDs';
import { Utxo } from '../../../serializable/avax/utxo';
import { UTXOID } from '../../../serializable/avax/utxoId';
import { Address, Id } from '../../../serializable/fxs/common';
import {
  OutputOwners,
  TransferOutput,
} from '../../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../../serializable/primitives';
import type {
  AddAutoRenewedValidatorTx,
  AddPermissionlessValidatorTx,
  BaseTx as PVMBaseTx,
} from '../../../serializable/pvm';
import { AvaxToNAvax } from '../../../utils/avaxToNAvax';
import {
  newAddAutoRenewedValidatorTx,
  newAddPermissionlessValidatorTx,
  newBaseTx,
} from './builder';

/**
 * The builders rewrite the owner of every change output — and, in the staking
 * builders, of the staked principal — to the change owner rather than
 * preserving the threshold of the UTXOs being spent. Callers spending M-of-N
 * UTXOs must be able to get M-of-N back, or a single cosigner can sweep the
 * change immediately and the principal when it unlocks.
 */

const owners2of3 = new OutputOwners(new BigIntPr(0n), new Int(2), [
  Address.fromBytes(testAddress1)[0],
  Address.fromBytes(testAddress2)[0],
  testOwnerXAddress,
]);

/** A UTXO owned 2-of-3, spendable when two of the three addresses are given. */
const multisigUtxo = (amount: bigint) =>
  new Utxo(
    new UTXOID(testUTXOID3, new Int(0)),
    Id.fromString(testContext.avaxAssetID),
    new TransferOutput(new BigIntPr(amount), owners2of3),
  );

const fromAddressesBytes = [testAddress1, testAddress2];
const nodeId = 'NodeID-2m38qc95mhHXtrhjyGbe7r2NhniqHHJRB';

describe('change and stake owners honour the caller threshold', () => {
  it('newBaseTx emits change with the requested threshold', () => {
    const tx = newBaseTx(
      {
        changeOwnerThreshold: 2,
        changeOwnerLocktime: 42n,
        feeState: feeState(),
        fromAddressesBytes,
        outputs: [],
        utxos: [multisigUtxo(AvaxToNAvax(5))],
      },
      testContext,
    );

    const { outputs } = (tx.getTx() as PVMBaseTx).baseTx;

    expect(outputs.length).toBeGreaterThan(0);
    outputs.forEach((out) => {
      expect(
        (out.output as TransferOutput).outputOwners.threshold.value(),
      ).toEqual(2);
      expect(
        (out.output as TransferOutput).outputOwners.locktime.value(),
      ).toEqual(42n);
    });
  });

  it('defaults to 1-of-N when the caller does not ask otherwise', () => {
    const tx = newBaseTx(
      {
        feeState: feeState(),
        fromAddressesBytes,
        outputs: [],
        utxos: [multisigUtxo(AvaxToNAvax(5))],
      },
      testContext,
    );

    const { outputs } = (tx.getTx() as PVMBaseTx).baseTx;

    outputs.forEach((out) => {
      expect(
        (out.output as TransferOutput).outputOwners.threshold.value(),
      ).toEqual(1);
    });
  });

  it('newAddPermissionlessValidatorTx applies it to the staked principal', () => {
    const tx = newAddPermissionlessValidatorTx(
      {
        changeOwnerThreshold: 2,
        delegatorRewardsOwner: [testAddress1, testAddress2],
        end: 120n,
        feeState: feeState(),
        fromAddressesBytes,
        nodeId,
        publicKey: blsPublicKeyBytes(),
        rewardAddresses: [testAddress1, testAddress2],
        shares: 20_000,
        signature: blsSignatureBytes(),
        start: 0n,
        subnetId: PrimaryNetworkID.toString(),
        threshold: 2,
        utxos: [multisigUtxo(AvaxToNAvax(5))],
        weight: AvaxToNAvax(1),
      },
      testContext,
    );

    const parsed = tx.getTx() as AddPermissionlessValidatorTx;

    // Staked principal, returned to its owner when the period ends.
    parsed.stake.forEach((out) => {
      expect(
        (out.output as TransferOutput).outputOwners.threshold.value(),
      ).toEqual(2);
    });

    // Change.
    parsed.baseTx.outputs.forEach((out) => {
      expect(
        (out.output as TransferOutput).outputOwners.threshold.value(),
      ).toEqual(2);
    });

    // Delegation-fee rewards owner (finding: was forced to 1-of-N).
    expect(parsed.getDelegatorRewardsOwner().threshold.value()).toEqual(2);
    expect(parsed.getValidatorRewardsOwner().threshold.value()).toEqual(2);
  });

  it('newAddAutoRenewedValidatorTx honours ownerThreshold for the config authority', () => {
    const tx = newAddAutoRenewedValidatorTx(
      {
        autoCompoundRewardShares: 500_000,
        changeOwnerThreshold: 2,
        delegatorRewardsOwner: [testAddress1, testAddress2],
        feeState: feeState(),
        fromAddressesBytes,
        nodeId,
        ownerAddresses: [testAddress1, testAddress2],
        ownerThreshold: 2,
        period: 1_209_600n,
        publicKey: blsPublicKeyBytes(),
        rewardAddresses: [testAddress1, testAddress2],
        shares: 20_000,
        signature: blsSignatureBytes(),
        threshold: 2,
        utxos: [multisigUtxo(AvaxToNAvax(5))],
        weight: AvaxToNAvax(1),
      },
      testContext,
    );

    const parsed = tx.getTx() as AddAutoRenewedValidatorTx;

    // validatorAuthority: the only authorisation for later config changes.
    expect(
      (parsed.validatorAuthority as OutputOwners).threshold.value(),
    ).toEqual(2);
    expect(
      (parsed.delegatorRewardsOwner as OutputOwners).threshold.value(),
    ).toEqual(2);

    parsed.stake.forEach((out) => {
      expect(
        (out.output as TransferOutput).outputOwners.threshold.value(),
      ).toEqual(2);
    });
  });
});
