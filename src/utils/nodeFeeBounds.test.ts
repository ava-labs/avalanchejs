import { describe, expect, it } from 'vitest';

import { testContext } from '../fixtures/context';
import { feeState } from '../fixtures/pvm';
import {
  fromAddressBytes,
  getValidUtxo,
  testOwnerXAddress,
} from '../fixtures/transactions';
import { BigIntPr } from '../serializable/primitives';
import { TransferableOutput } from '../serializable/avax';
import { AvaxToNAvax } from './avaxToNAvax';
import { newBaseTx as avmBaseTx, newExportTx as avmExportTx } from '../vms/avm';
import { newExportTxFromBaseFee } from '../vms/evm/builder';
import type { ExportTx as EvmExportTx } from '../serializable/evm';
import { testAddress1, testEthAddress1 } from '../fixtures/vms';
import { newBaseTx as pvmBaseTx } from '../vms/pvm/etna-builder/builder';
import { validateBurnedAmount } from './validateBurnedAmount/validateBurnedAmount';
import { validateStaticBurnedAmount } from './validateBurnedAmount/validateStaticBurnedAmount';
import {
  requireNonNegativeBigInt,
  requireNonNegativeInteger,
} from './nodeFees';

/**
 * The RPC node decides every fee the builders burn, and it also serves the
 * caller's UTXOs, so it knows the balance it is sizing the fee against. The
 * burn is irreversible once signed and accepted. These tests pin the two
 * defences: well-formedness of what the node said, and a ceiling it does not
 * control.
 */

const utxos = [getValidUtxo(new BigIntPr(AvaxToNAvax(50)))];

describe('node-supplied fee guards', () => {
  it('rejects malformed node numerics', () => {
    expect(() => requireNonNegativeInteger(-1, 'weights[0]')).toThrow(
      /non-negative integer/,
    );
    expect(() => requireNonNegativeInteger(1.5, 'weights[0]')).toThrow(
      /non-negative integer/,
    );
    expect(() => requireNonNegativeInteger('abc', 'weights[0]')).toThrow(
      /non-negative integer/,
    );
    expect(requireNonNegativeInteger('4', 'weights[0]')).toEqual(4);

    expect(() => requireNonNegativeBigInt('-5', 'price')).toThrow(
      /non-negative/,
    );
    expect(() => requireNonNegativeBigInt('1.5', 'price')).toThrow(
      /an integer/,
    );
    expect(requireNonNegativeBigInt('7', 'price')).toEqual(7n);
  });
});

describe('X-chain static fee ceiling', () => {
  // A node that reports a txFee sized to the victim's balance.
  // Sized to the wallet, not beyond it: the tx builds and burns 40 AVAX.
  const gougingContext = { ...testContext, baseTxFee: AvaxToNAvax(40) };

  it('newBaseTx throws when the node fee exceeds maxFee', () => {
    expect(() =>
      avmBaseTx(gougingContext, fromAddressBytes, utxos, [], {
        maxFee: 1_000_000n,
      }),
    ).toThrow(/exceeds the caller supplied maximum/);
  });

  it('newExportTx throws when the node fee exceeds maxFee', () => {
    const out = TransferableOutput.fromNative(testContext.avaxAssetID, 1_000n, [
      testOwnerXAddress.toBytes(),
    ]);

    expect(() =>
      avmExportTx(
        gougingContext,
        testContext.pBlockchainID,
        fromAddressBytes,
        utxos,
        [out],
        { maxFee: 1_000_000n },
      ),
    ).toThrow(/exceeds the caller supplied maximum/);
  });

  it('builds normally when the fee is within maxFee', () => {
    expect(() =>
      avmBaseTx(testContext, fromAddressBytes, utxos, [], {
        maxFee: 10n ** 12n,
      }),
    ).not.toThrow();
  });
});

describe('P-chain dynamic fee ceiling', () => {
  it('newBaseTx throws when gas * price exceeds maxFee', () => {
    expect(() =>
      pvmBaseTx(
        {
          feeState: { ...feeState(), price: 10n ** 12n },
          fromAddressesBytes: fromAddressBytes,
          maxFee: 1_000_000n,
          outputs: [],
          utxos,
        },
        testContext,
      ),
    ).toThrow(/exceeds the caller supplied maximum/);
  });

  it('builds normally when the fee is within maxFee', () => {
    expect(() =>
      pvmBaseTx(
        {
          feeState: feeState(),
          fromAddressesBytes: fromAddressBytes,
          maxFee: 10n ** 12n,
          outputs: [],
          utxos,
        },
        testContext,
      ),
    ).not.toThrow();
  });
});

describe('burn validation does not trust the node it is checking', () => {
  it('validateStaticBurnedAmount flags an inflated fee against a caller expectation', () => {
    const inflated = AvaxToNAvax(40);
    const gougingContext = { ...testContext, baseTxFee: inflated };
    const unsignedTx = avmBaseTx(gougingContext, fromAddressBytes, utxos, []);

    // Against the node's own number it "passes" — the tautology.
    expect(
      validateStaticBurnedAmount({
        unsignedTx,
        context: gougingContext,
        burnedAmount: inflated,
      }).isValid,
    ).toBe(true);

    // Against an expectation the node cannot move, it fails.
    expect(
      validateStaticBurnedAmount({
        unsignedTx,
        context: gougingContext,
        burnedAmount: inflated,
        expectedFee: 1_000_000n,
      }).isValid,
    ).toBe(false);
  });

  it('validateBurnedAmount rejects a burn above the caller ceiling', () => {
    const inflated = AvaxToNAvax(40);
    const gougingContext = { ...testContext, baseTxFee: inflated };
    const unsignedTx = avmBaseTx(gougingContext, fromAddressBytes, utxos, []);

    expect(
      validateBurnedAmount({
        unsignedTx,
        context: gougingContext,
        burnedAmount: inflated,
        baseFee: 1n,
        feeTolerance: 20,
        maxFee: 1_000_000n,
      }).isValid,
    ).toBe(false);
  });
});

describe('C-chain baseFee units', () => {
  // EVMApi.getBaseFee() returns wei; the FromBaseFee builders expect nAVAX.
  // The examples divide by 1e9. This pins that convention so a missed
  // conversion is caught here rather than costing 1e9x the intended fee.
  const exportTx = (baseFee: bigint, maxFee?: bigint) =>
    newExportTxFromBaseFee(
      testContext,
      baseFee,
      AvaxToNAvax(1),
      testContext.xBlockchainID,
      testEthAddress1,
      [testAddress1],
      1n,
      undefined,
      undefined,
      maxFee,
    );

  const burnOf = (tx: ReturnType<typeof exportTx>) => {
    const evmTx = tx.getTx() as EvmExportTx;
    const inSum = evmTx.ins.reduce((a, i) => a + i.amount.value(), 0n);
    const outSum = evmTx.exportedOutputs.reduce(
      (a, o) => a + o.output.amount(),
      0n,
    );
    return inSum - outSum;
  };

  it('treats baseFee as nAVAX, so wei inflates the burn by exactly 1e9', () => {
    const inNAvax = burnOf(exportTx(25n));
    const inWei = burnOf(exportTx(25n * BigInt(1e9)));

    expect(inNAvax).toBeGreaterThan(0n);
    expect(inWei).toEqual(inNAvax * BigInt(1e9));
  });

  it('maxFee catches a baseFee passed in wei by mistake', () => {
    const correctBurn = burnOf(exportTx(25n));

    // A caller who forgets `/ 1e9` and sets a sane ceiling is protected.
    expect(() => exportTx(25n * BigInt(1e9), correctBurn * 10n)).toThrow(
      /exceeds the caller supplied maximum/,
    );
  });
});
