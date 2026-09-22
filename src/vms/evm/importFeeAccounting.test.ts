import { describe, expect, it } from 'vitest';

import { testContext } from '../../fixtures/context';
import { testAddress1, testAddress2 } from '../../fixtures/vms';
import { Utxo } from '../../serializable/avax/utxo';
import { UTXOID } from '../../serializable/avax/utxoId';
import { Address, Id } from '../../serializable/fxs/common';
import { OutputOwners, TransferOutput } from '../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../serializable/primitives';
import type { ImportTx } from '../../serializable/evm';
import { AvaxToNAvax } from '../../utils/avaxToNAvax';
import { newImportTx } from './builder';

/**
 * The fee must be attributed only to atomic UTXOs that actually become
 * ImportedInputs. Charging it against a UTXO before checking that the caller
 * can spend it let a third party — anyone who exports a dust output naming the
 * victim among N-of-M owners — consume the victim's fee budget, so the built
 * import under-burned and coreth rejected it.
 */

const utxo = (idHex: string, amount: bigint, owners: OutputOwners): Utxo =>
  new Utxo(
    new UTXOID(Id.fromHex(idHex), new Int(0)),
    Id.fromString(testContext.avaxAssetID),
    new TransferOutput(new BigIntPr(amount), owners),
  );

const victimOwned = (amount: bigint, idHex: string) =>
  utxo(idHex, amount, OutputOwners.fromNative([testAddress1]));

/** 2-of-2 [attacker, victim]: the victim cannot sign it alone. */
const foreignTwoOfTwo = (amount: bigint, idHex: string) =>
  utxo(
    idHex,
    amount,
    new OutputOwners(new BigIntPr(0n), new Int(2), [
      Address.fromBytes(testAddress1)[0],
      Address.fromBytes(testAddress2)[0],
    ]),
  );

const ID_A =
  '0x0000000000000000000000000000000000000000000000000000000000000001';
const ID_B =
  '0x0000000000000000000000000000000000000000000000000000000000000002';

const sums = (tx: ImportTx) => {
  const inSum = tx.importedInputs.reduce((a, i) => a + i.amount(), 0n);
  const outSum = tx.Outs.reduce((a, o) => a + o.amount.value(), 0n);
  return { inSum, outSum };
};

describe('EVM newImportTx fee accounting', () => {
  const fee = 1_000_000n;

  it('burns exactly the fee when a foreign UTXO precedes the spendable one', () => {
    const unsignedTx = newImportTx(
      testContext,
      testAddress1,
      [testAddress1],
      // Foreign dust first — the ordering the attacker arranges.
      [foreignTwoOfTwo(1n, ID_A), victimOwned(AvaxToNAvax(10), ID_B)],
      testContext.xBlockchainID,
      fee,
    );

    const { inSum, outSum } = sums(unsignedTx.getTx() as ImportTx);

    expect(inSum - outSum).toEqual(fee);
  });

  it('throws when only unspendable fee-asset UTXOs are available', () => {
    expect(() =>
      newImportTx(
        testContext,
        testAddress1,
        [testAddress1],
        [foreignTwoOfTwo(AvaxToNAvax(10), ID_A)],
        testContext.xBlockchainID,
        fee,
      ),
    ).toThrow(/insufficient funds for fee/);
  });

  it('imports a UTXO whose owners locktime has already passed', () => {
    // locktime 1 is decades in the past, but the hard-coded minIssuanceTime of
    // 0n treated every locktime >= 1 as unspendable, forever.
    const expired = utxo(
      ID_A,
      AvaxToNAvax(10),
      new OutputOwners(new BigIntPr(1n), new Int(1), [
        Address.fromBytes(testAddress1)[0],
      ]),
    );

    const unsignedTx = newImportTx(
      testContext,
      testAddress1,
      [testAddress1],
      [expired],
      testContext.xBlockchainID,
      fee,
    );

    const tx = unsignedTx.getTx() as ImportTx;

    expect(tx.importedInputs).toHaveLength(1);
    const { inSum, outSum } = sums(tx);
    expect(inSum - outSum).toEqual(fee);
  });
});
