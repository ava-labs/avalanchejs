import { describe, expect, it } from 'vitest';
import { UnsignedTx } from './unsignedTx';
import {
  BaseTx as AvaxBaseTx,
  TransferableInput,
} from '../../serializable/avax';
import { BaseTx } from '../../serializable/avm';
import { bigIntPr, bytes, int } from '../../fixtures/primitives';
import { id } from '../../fixtures/common';
import { transferableOutput, utxoId } from '../../fixtures/avax';
import { Input, TransferInput } from '../../serializable/fxs/secp256k1';
import { AddressMap, AddressMaps } from '../../utils/addressMap';
import { Address } from '../../serializable/fxs/common';
import {
  testAddress1,
  testAddress2,
  testPrivateKey1,
  testPrivateKey2,
} from '../../fixtures/vms';
import { addTxSignatures } from '../../signer';
import { secp256k1 } from '../../crypto';

// One credential with two slots: slot 0 belongs to address1, slot 1 to address2.
const twoOfTwoTx = () =>
  new UnsignedTx(
    new BaseTx(
      new AvaxBaseTx(
        int(),
        id(),
        [transferableOutput()],
        [
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
      new AddressMap([
        [new Address(testAddress1), 0],
        [new Address(testAddress2), 1],
      ]),
    ]),
  );

describe('UnsignedTx.hasAllSignatures', () => {
  it('is false while a slot still holds a placeholder', async () => {
    const unsignedTx = twoOfTwoTx();

    await addTxSignatures({ unsignedTx, privateKeys: [testPrivateKey1] });

    expect(unsignedTx.hasAllSignatures()).toBe(false);
  });

  it('is true when every slot is signed by its own owner', async () => {
    const unsignedTx = twoOfTwoTx();

    await addTxSignatures({
      unsignedTx,
      privateKeys: [testPrivateKey1, testPrivateKey2],
    });

    expect(unsignedTx.hasAllSignatures()).toBe(true);
  });

  // Previously this returned true: each slot was only checked against the whole
  // address map, so one signer could satisfy a 2 of 2 threshold on their own.
  it('is false when one signer fills a slot they do not own', async () => {
    const unsignedTx = twoOfTwoTx();

    await addTxSignatures({ unsignedTx, privateKeys: [testPrivateKey1] });

    const signature1 = await secp256k1.sign(
      unsignedTx.toBytes(),
      testPrivateKey1,
    );
    // drop address1's signature into address2's slot
    unsignedTx.addSignatureAt(signature1, 0, 1);

    // no placeholders remain, so this is purely the ownership check
    expect(
      unsignedTx
        .getCredentials()
        .every((cred) =>
          cred.getSignatures().every((sig) => !/^0x0+$/.test(sig)),
        ),
    ).toBe(true);
    expect(unsignedTx.hasAllSignatures()).toBe(false);
  });
});
