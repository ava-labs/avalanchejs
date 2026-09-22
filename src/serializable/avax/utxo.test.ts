import { concatBytes, hexToBuffer } from '../../utils/buffer';
import { describe, expect, it } from 'vitest';

import { getPVMManager } from '../pvm/codec';
import { getAVMManager } from '../avm/codec';
import { Utxo } from './utxo';
import { UTXOID } from './utxoId';
import { Id } from '../fxs/common';
import { getUtxoInfo } from '../../utils/getUtxoInfo';
import {
  mintOutput as nftMintOutput,
  transferOutput as nftTransferOutput,
} from '../../fixtures/nft';
import {
  mintOutput as secpMintOutput,
  transferOutput as secpTransferOutput,
} from '../../fixtures/secp256k1';

// testSerialization('Utxo', Utxo, utxo, utxoBytes);

describe('examples with real data', () => {
  it('samlpe 1', () => {
    const bytes =
      '0x00004cc3cf2e380c03f0227193a6573d1940350a43f028123ca68c14f54e33a11dcf000000093d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000160000000063af7b800000000700000002540be40000000000000000000000000100000001e0cfe8cae22827d032805ded484e393ce51cbedb7f24bb9c';

    getPVMManager().unpack(hexToBuffer(bytes), Utxo);
  });
});

describe('getOutputOwners', () => {
  const utxoWith = (output: Parameters<typeof makeUtxo>[0]) => makeUtxo(output);

  function makeUtxo(output: ConstructorParameters<typeof Utxo>[2]) {
    return new Utxo(
      UTXOID.fromNative(
        '2QouvFWUbjuySRxeX5xMbue4WeWDHDyMySwE9YeQNJzCKxFyRa',
        0,
      ),
      Id.fromString('2QouvFWUbjuySRxeX5xMbue4WeWDHDyMySwE9YeQNJzCKxFyRa'),
      output,
    );
  }

  it.each([
    ['secp256k1fx transfer output', secpTransferOutput],
    ['secp256k1fx mint output', secpMintOutput],
    ['nftfx transfer output', nftTransferOutput],
    ['nftfx mint output', nftMintOutput],
  ])('returns the owners of a %s', (_label, makeOutput) => {
    const owners = utxoWith(makeOutput()).getOutputOwners();

    expect(owners.addrs.length).toBeGreaterThan(0);
    expect(owners.threshold.value()).toBeGreaterThan(0);
  });

  it('names the offending type when the output has no owners', () => {
    // avax.TransferableOutput wraps an output rather than being one, so it has
    // no owners of its own — a caller mistake that should stay loud.
    const wrapper = utxoWith({
      _type: 'avax.TransferableOutput',
    } as ConstructorParameters<typeof Utxo>[2]);

    expect(() => wrapper.getOutputOwners()).toThrowError(
      'unable to get output owner for output type: avax.TransferableOutput',
    );
  });
});

describe('getUtxoInfo', () => {
  // Regression: an nftfx output in a UTXO set used to throw here, which took
  // out every X-chain operation for wallets holding one.
  it.each([
    ['nftfx transfer output', nftTransferOutput],
    ['nftfx mint output', nftMintOutput],
    ['secp256k1fx mint output', secpMintOutput],
  ])(
    'reports a %s as zero-amount instead of throwing',
    (_label, makeOutput) => {
      const utxo = new Utxo(
        UTXOID.fromNative(
          '2QouvFWUbjuySRxeX5xMbue4WeWDHDyMySwE9YeQNJzCKxFyRa',
          0,
        ),
        Id.fromString('2QouvFWUbjuySRxeX5xMbue4WeWDHDyMySwE9YeQNJzCKxFyRa'),
        makeOutput(),
      );

      const info = getUtxoInfo(utxo);

      expect(info.amount).toBe(0n);
      expect(info.threshold).toBeGreaterThan(0);
    },
  );

  it('still reports the amount of a spendable transfer output', () => {
    const output = secpTransferOutput();
    const utxo = new Utxo(
      UTXOID.fromNative(
        '2QouvFWUbjuySRxeX5xMbue4WeWDHDyMySwE9YeQNJzCKxFyRa',
        0,
      ),
      Id.fromString('2QouvFWUbjuySRxeX5xMbue4WeWDHDyMySwE9YeQNJzCKxFyRa'),
      output,
    );

    expect(getUtxoInfo(utxo).amount).toBe(output.amount());
  });
});

describe('nftfx UTXO through the AVM codec', () => {
  // Round-trip rather than a hardcoded blob: this is what pins the fix to the
  // wire format, since it proves the AVM codec's type ID for nftfx.TransferOutput
  // still decodes to a type getOutputOwners() handles.
  it('survives a serialize/parse cycle and reports zero amount', () => {
    const manager = getAVMManager();
    const utxo = new Utxo(
      UTXOID.fromNative(
        '2QouvFWUbjuySRxeX5xMbue4WeWDHDyMySwE9YeQNJzCKxFyRa',
        1,
      ),
      Id.fromString('2QouvFWUbjuySRxeX5xMbue4WeWDHDyMySwE9YeQNJzCKxFyRa'),
      nftTransferOutput(),
    );

    // Utxo isn't a registered top-level codec type, so it can't go through
    // packCodec: serialized UTXOs are a bare codec-version prefix plus the body.
    const serialized = concatBytes(
      new Uint8Array([0, 0]),
      utxo.toBytes(manager.getDefaultCodec()),
    );
    const parsed = manager.unpack(serialized, Utxo);

    expect(parsed.output._type).toBe('nftfx.TransferOutput');
    expect(parsed.getOutputOwners().threshold.value()).toBeGreaterThan(0);
    expect(getUtxoInfo(parsed).amount).toBe(0n);
  });
});
