import {
  transferableOutput,
  transferableOutputs,
  utxoId,
} from '../../fixtures/avax';
import { describe, beforeEach, it, expect } from 'vitest';

import { id } from '../../fixtures/common';
import { bigIntPr, bytes, int } from '../../fixtures/primitives';
import { signature, transferOutput } from '../../fixtures/secp256k1';
import {
  testAddress1,
  testAddress2,
  testPublicKey1,
  testPrivateKey1,
  testPrivateKey2,
  testPublicKey2,
} from '../../fixtures/vms';
import { BaseTx, TransferableInput } from '../../serializable/avax';
import { Utxo } from '../../serializable/avax/utxo';
import { ExportTx } from '../../serializable/avm';
import { Address } from '../../serializable/fxs/common';
import { Input, TransferInput } from '../../serializable/fxs/secp256k1';
import { secp256k1 } from '../../crypto';
import { AddressMap, AddressMaps } from '../../utils/addressMap';
import { UnsignedTx } from './unsignedTx';

describe('UnsignedTx', () => {
  let addressMaps: AddressMaps;
  beforeEach(() => {
    addressMaps = new AddressMaps([
      new AddressMap([[new Address(testAddress1), 0]]),
      new AddressMap([
        [new Address(testAddress2), 0],
        [new Address(testAddress1), 1],
      ]),
    ]);
  });

  it('hasAllSignatures', async () => {
    const tx = new ExportTx(
      new BaseTx(
        int(),
        id(),
        [transferableOutput()],
        [
          new TransferableInput(
            utxoId(),
            id(),
            new TransferInput(bigIntPr(), Input.fromNative([0])),
          ),
          new TransferableInput(
            utxoId(),
            id(),
            new TransferInput(bigIntPr(), Input.fromNative([0, 1])),
          ),
        ],
        bytes(),
      ),
      id(),
      transferableOutputs(),
    );

    const unsignedTx = new UnsignedTx(tx, [], addressMaps);
    const unsignedBytes = unsignedTx.toBytes();

    expect(unsignedTx.hasAllSignatures()).toBeFalsy();

    const sig = await secp256k1.sign(unsignedBytes, testPrivateKey1);
    unsignedTx.addSignature(sig);
    expect(unsignedTx.hasAllSignatures()).toBeFalsy();

    const sig2 = await secp256k1.sign(unsignedBytes, testPrivateKey2);
    unsignedTx.addSignature(sig2);

    expect(unsignedTx.hasAllSignatures()).toBeTruthy();
  });

  it('serializes', () => {
    const tx = new ExportTx(
      new BaseTx(
        int(),
        id(),
        [transferableOutput()],
        [
          new TransferableInput(
            utxoId(),
            id(),
            new TransferInput(bigIntPr(), Input.fromNative([0])),
          ),
          new TransferableInput(
            utxoId(),
            id(),
            new TransferInput(bigIntPr(), Input.fromNative([0, 1])),
          ),
        ],
        bytes(),
      ),
      id(),
      transferableOutputs(),
    );

    const unsignedTx = new UnsignedTx(
      tx,
      [new Utxo(utxoId(), id(), transferOutput())],
      addressMaps,
    );
    unsignedTx.addSignatureAt(signature().toBytes(), 0, 0);
    const unsignedTxJson = JSON.stringify(unsignedTx);

    expect(UnsignedTx.fromJSON(unsignedTxJson)).toEqual(unsignedTx);
  });

  describe('getSigIndicesForAddress', () => {
    it('returns the correct indices when all signature slots are present', () => {
      const tx = new ExportTx(
        new BaseTx(
          int(),
          id(),
          [transferableOutput()],
          [
            new TransferableInput(
              utxoId(),
              id(),
              new TransferInput(bigIntPr(), Input.fromNative([0])),
            ),
            new TransferableInput(
              utxoId(),
              id(),
              new TransferInput(bigIntPr(), Input.fromNative([0, 1])),
            ),
          ],
          bytes(),
        ),
        id(),
        transferableOutputs(),
      );

      const unsignedTx = new UnsignedTx(tx, [], addressMaps);
      const addr1SigIndices = unsignedTx.getSigIndicesForPubKey(testPublicKey1);
      const addr2SigIndices = unsignedTx.getSigIndicesForPubKey(testPublicKey2);

      expect(unsignedTx.credentials[0].toJSON()).toHaveLength(1);
      expect(unsignedTx.credentials[1].toJSON()).toHaveLength(2);
      expect(addr1SigIndices).toStrictEqual([
        [0, 0],
        [1, 1],
      ]);
      expect(addr2SigIndices).toStrictEqual([[1, 0]]);
    });

    it('returns the correct indices when signature slots are missing', () => {
      const tx = new ExportTx(
        new BaseTx(
          int(),
          id(),
          [transferableOutput()],
          [
            new TransferableInput(
              utxoId(),
              id(),
              new TransferInput(bigIntPr(), Input.fromNative([0])),
            ),
            new TransferableInput(
              utxoId(),
              id(),
              new TransferInput(bigIntPr(), Input.fromNative([1])),
            ),
          ],
          bytes(),
        ),
        id(),
        transferableOutputs(),
      );

      const unsignedTx = new UnsignedTx(
        tx,
        [],
        new AddressMaps([
          new AddressMap([[new Address(testAddress1), 0]]),
          new AddressMap([[new Address(testAddress1), 1]]), // missing signature slot at index 0
        ]),
      );
      const addr1SigIndices = unsignedTx.getSigIndicesForPubKey(testPublicKey1);

      expect(unsignedTx.credentials[0].toJSON()).toHaveLength(1);
      expect(unsignedTx.credentials[1].toJSON()).toHaveLength(1);
      expect(addr1SigIndices).toStrictEqual([
        [0, 0],
        [1, 0], // using re-ordered index 0 instead of 1
      ]);
    });
  });
});
