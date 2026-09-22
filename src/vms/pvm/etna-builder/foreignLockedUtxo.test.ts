import { describe, expect, it } from 'vitest';

import { testContext } from '../../../fixtures/context';
import { feeState } from '../../../fixtures/pvm';
import {
  blsPublicKeyBytes,
  blsSignatureBytes,
} from '../../../fixtures/primitives';
import {
  fromAddressBytes,
  getValidUtxo,
  testAvaxAssetID,
  testOwnerXAddress,
  testUTXOID1,
} from '../../../fixtures/transactions';
import { Address } from '../../../serializable/fxs/common';
import { PrimaryNetworkID } from '../../../constants/networkIDs';
import {
  OutputOwners,
  TransferOutput,
} from '../../../serializable/fxs/secp256k1';
import { StakeableLockOut } from '../../../serializable/pvm';
import { BigIntPr, Int } from '../../../serializable/primitives';
import { Utxo } from '../../../serializable/avax/utxo';
import { UTXOID } from '../../../serializable/avax/utxoId';
import { AvaxToNAvax } from '../../../utils/avaxToNAvax';
import {
  newAddPermissionlessDelegatorTx,
  newAddPermissionlessValidatorTx,
  newAddAutoRenewedValidatorTx,
} from './builder';

/**
 * A locked, stakeable UTXO that the victim cannot sign for on their own.
 *
 * Any P-chain participant can create one of these naming someone else among
 * its owners, and the node indexes it under every owner address, so it comes
 * back from getUTXOs mixed in with the victim's real UTXOs. The staking
 * builders must skip it and fund from the victim's unlocked UTXO instead of
 * aborting the whole spend.
 */
const foreignLockedUtxo = ({
  twoOfTwo = true,
}: { twoOfTwo?: boolean } = {}): Utxo => {
  const attacker = Address.fromHex('deadbeefdeadbeefdeadbeefdeadbeefdeadbeef');

  const innerOwners = twoOfTwo
    ? // 2-of-2 [victim, attacker]: matchOwners cannot reach the threshold.
      new OutputOwners(new BigIntPr(0n), new Int(2), [
        testOwnerXAddress,
        attacker,
      ])
    : // 1-of-1 [victim] but the inner owners' locktime is far in the future.
      new OutputOwners(new BigIntPr(1n << 40n), new Int(1), [
        testOwnerXAddress,
      ]);

  return new Utxo(
    new UTXOID(testUTXOID1, new Int(0)),
    testAvaxAssetID,
    new StakeableLockOut(
      new BigIntPr(BigInt(Math.floor(Date.now() / 1000)) + 1_000_000n),
      new TransferOutput(new BigIntPr(1n), innerOwners),
    ),
  );
};

const nodeId = 'NodeID-2m38qc95mhHXtrhjyGbe7r2NhniqHHJRB';
const stakeAmount = AvaxToNAvax(1);

describe.each([
  { shape: '2-of-2 [victim, attacker]', twoOfTwo: true },
  { shape: '1-of-1 [victim] with future inner locktime', twoOfTwo: false },
])('staking builders skip a foreign locked UTXO ($shape)', ({ twoOfTwo }) => {
  const utxos = () => [
    getValidUtxo(new BigIntPr(AvaxToNAvax(3))),
    foreignLockedUtxo({ twoOfTwo }),
  ];

  it('newAddPermissionlessValidatorTx funds from the unlocked UTXO', () => {
    const tx = newAddPermissionlessValidatorTx(
      {
        delegatorRewardsOwner: [testOwnerXAddress.toBytes()],
        end: 120n,
        feeState: feeState(),
        fromAddressesBytes: fromAddressBytes,
        nodeId,
        publicKey: blsPublicKeyBytes(),
        rewardAddresses: [testOwnerXAddress.toBytes()],
        shares: 20_000,
        signature: blsSignatureBytes(),
        start: 0n,
        subnetId: PrimaryNetworkID.toString(),
        utxos: utxos(),
        weight: stakeAmount,
      },
      testContext,
    );

    expect(tx.getTx()).toBeDefined();
    expect(tx.utxos.length).toBeGreaterThan(0);
  });

  it('newAddPermissionlessDelegatorTx funds from the unlocked UTXO', () => {
    const tx = newAddPermissionlessDelegatorTx(
      {
        end: 120n,
        feeState: feeState(),
        fromAddressesBytes: fromAddressBytes,
        nodeId,
        rewardAddresses: [testOwnerXAddress.toBytes()],
        start: 0n,
        subnetId: PrimaryNetworkID.toString(),
        utxos: utxos(),
        weight: stakeAmount,
      },
      testContext,
    );

    expect(tx.getTx()).toBeDefined();
    expect(tx.utxos.length).toBeGreaterThan(0);
  });

  it('newAddAutoRenewedValidatorTx funds from the unlocked UTXO', () => {
    const tx = newAddAutoRenewedValidatorTx(
      {
        delegatorRewardsOwner: [testOwnerXAddress.toBytes()],
        feeState: feeState(),
        fromAddressesBytes: fromAddressBytes,
        nodeId,
        publicKey: blsPublicKeyBytes(),
        rewardAddresses: [testOwnerXAddress.toBytes()],
        shares: 20_000,
        signature: blsSignatureBytes(),
        utxos: utxos(),
        weight: stakeAmount,
        ownerAddresses: [testOwnerXAddress.toBytes()],
        autoCompoundRewardShares: 500_000,
        period: 1_209_600n,
      },
      testContext,
    );

    expect(tx.getTx()).toBeDefined();
    expect(tx.utxos.length).toBeGreaterThan(0);
  });
});
