import { signature } from '../../fixtures/secp256k1';
import { describe, beforeEach, it, expect } from 'vitest';

import { exportTx } from '../../fixtures/evm';
import { testEthAddress1, testPrivateKey1 } from '../../fixtures/vms';
import { Address } from '../../serializable/fxs/common';
import { secp256k1 } from '../../crypto';
import { AddressMap, AddressMaps } from '../../utils/addressMap';
import { EVMUnsignedTx } from './evmUnsignedTx';

describe('EVMUnsignedTx', () => {
  let addressMaps: AddressMaps;

  beforeEach(() => {
    addressMaps = new AddressMaps([
      new AddressMap([[new Address(testEthAddress1), 0]]),
    ]);
  });

  it('hasAllSignatures', async () => {
    const tx = exportTx();
    const unsignedTx = new EVMUnsignedTx(tx, [], addressMaps);
    const unsignedBytes = unsignedTx.toBytes();

    expect(unsignedTx.hasAllSignatures()).toBeFalsy();

    const sig = await secp256k1.sign(unsignedBytes, testPrivateKey1);
    unsignedTx.addSignature(sig);

    expect(unsignedTx.hasAllSignatures()).toBeTruthy();
  });

  it('serializes', () => {
    const tx = exportTx();
    const unsignedTx = new EVMUnsignedTx(tx, [], addressMaps);

    unsignedTx.addSignatureAt(signature().toBytes(), 0, 0);

    const unsignedTxJson = JSON.stringify(unsignedTx);
    const serializedTx = EVMUnsignedTx.fromJSON(unsignedTxJson);

    // workaround until this jest bug (https://github.com/facebook/jest/issues/12377) gets fixed
    // jest fails to parse bigints in the tx.ins, so we check the tx properties' byte representation instead
    expect(unsignedTx.toBytes()).toStrictEqual(serializedTx.toBytes());
    expect(unsignedTx.utxos).toStrictEqual(serializedTx.utxos);
    expect(unsignedTx.addressMaps).toStrictEqual(serializedTx.addressMaps);
    expect(unsignedTx.credentials).toStrictEqual(serializedTx.credentials);
  });
});
