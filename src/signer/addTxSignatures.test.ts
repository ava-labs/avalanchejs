import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnsignedTx } from '../vms';
import { BaseTx as AvaxBaseTx, TransferableInput } from '../serializable/avax';
import { bigIntPr, bytes, int } from '../fixtures/primitives';
import { id } from '../fixtures/common';
import { BaseTx } from '../serializable/avm';
import { transferableOutput, utxoId } from '../fixtures/avax';
import { Input, TransferInput } from '../serializable/fxs/secp256k1';
import { AddressMaps, AddressMap, hexToBuffer } from '../utils';
import { Address } from '../serializable/fxs/common';
import {
  testAddress1,
  testAddress2,
  testPrivateKey1,
  testPrivateKey2,
  testPublicKey1,
  testPublicKey2,
} from '../fixtures/vms';
import { addTxSignatures } from './addTxSignatures';
import { secp256k1 } from '../crypto';

describe('addTxSignatures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds the signatures correctly', async () => {
    const hasPubkeySpy = vi.spyOn(UnsignedTx.prototype, 'hasPubkey');
    const addSignatureSpy = vi.spyOn(UnsignedTx.prototype, 'addSignature');
    const unknownPrivateKey = hexToBuffer(
      '1d4ff8f6582d995354f5c03a28a043d22aa1bb6aa15879a632134aaf1f225cf4',
    );
    const unknownPublicKey = secp256k1.getPublicKey(unknownPrivateKey);

    const unsignedTx = new UnsignedTx(
      new BaseTx(
        new AvaxBaseTx(
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
      ),
      [],
      new AddressMaps([
        new AddressMap([[new Address(testAddress1), 0]]),
        new AddressMap([
          [new Address(testAddress2), 0],
          [new Address(testAddress1), 1],
        ]),
      ]),
    );

    await addTxSignatures({
      unsignedTx,
      privateKeys: [testPrivateKey1, testPrivateKey2, unknownPrivateKey],
    });

    expect(hasPubkeySpy).toHaveBeenCalledTimes(3);
    expect(hasPubkeySpy).toHaveBeenNthCalledWith(1, testPublicKey1);
    expect(hasPubkeySpy).toHaveBeenNthCalledWith(2, testPublicKey2);
    expect(hasPubkeySpy).toHaveBeenNthCalledWith(3, unknownPublicKey);

    expect(addSignatureSpy).toHaveBeenCalledTimes(2);
    expect(addSignatureSpy).toHaveBeenCalledWith(
      hexToBuffer(
        '0x7b3da43d8e4103d1078061872075cbcbb5de0108f3d897752c894757cf0e9c4113949ca2a5568483763e1fa0e74b4f4dd9b2a6e40909d0729f87c7dddfc1e70601',
      ),
    );
    expect(addSignatureSpy).toHaveBeenCalledWith(
      hexToBuffer(
        '0x04e2072e34fd5d7cc729afb8bfe7c5865754c3c448b9b3247b16cabbf06378393edf405274048bef74c02862ae032c0b86dda7c28bebf63f4d1de4f517bd710500',
      ),
    );

    expect(unsignedTx.hasAllSignatures()).toBe(true);
  });
});
