import {
  transferableOutput,
  transferableOutputs,
  utxoId,
} from '../../fixtures/avax';
import { id } from '../../fixtures/common';
import { bigIntPr, bytes, int } from '../../fixtures/primitives';
import { transferOutput } from '../../fixtures/secp256k1';
import {
  testAddress1,
  testAddress2,
  testPrivateKey1,
  testPrivateKey2,
} from '../../fixtures/vms';
import { BaseTx, TransferableInput } from '../../serializable/avax';
import { Utxo } from '../../serializable/avax/utxo';
import { ExportTx } from '../../serializable/avm';
import { Address } from '../../serializable/fxs/common';
import { Input, TransferInput } from '../../serializable/fxs/secp256k1';
import { sign } from '../../utils';
import { AddressMap, AddressMaps } from '../../utils/addressMap';
import { UnsignedTx } from './unsignedTx';

describe('UnsignedTx', () => {
  let addressMaps: AddressMaps;
  beforeEach(() => {
    addressMaps = new AddressMaps([
      new AddressMap([[new Address(testAddress1), 0]]),
      new AddressMap([[new Address(testAddress2), 0]]),
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
            new TransferInput(bigIntPr(), Input.fromNative([0])),
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

    const sig = await sign(unsignedBytes, testPrivateKey1);
    unsignedTx.addSignature(sig);
    expect(unsignedTx.hasAllSignatures()).toBeFalsy();

    const sig2 = await sign(unsignedBytes, testPrivateKey2);
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
            new TransferInput(bigIntPr(), Input.fromNative([0])),
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
    const unsignedTxJson = unsignedTx.toJSON();

    expect(UnsignedTx.fromJSON(unsignedTxJson)).toEqual(unsignedTx);
  });
});
