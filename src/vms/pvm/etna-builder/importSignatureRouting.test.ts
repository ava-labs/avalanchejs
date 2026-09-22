import { describe, expect, it } from 'vitest';

import { sha256 } from '@noble/hashes/sha256';

import { secp256k1 } from '../../../crypto';
import { bufferToHex, hexToBuffer } from '../../../utils/buffer';
import { testContext } from '../../../fixtures/context';
import { feeState } from '../../../fixtures/pvm';
import {
  testAddress1,
  testAddress2,
  testPrivateKey1,
  testPrivateKey2,
  testPublicKey1,
  testPublicKey2,
} from '../../../fixtures/vms';
import { Utxo } from '../../../serializable/avax/utxo';
import { UTXOID } from '../../../serializable/avax/utxoId';
import { Id } from '../../../serializable/fxs/common';
import {
  OutputOwners,
  TransferOutput,
} from '../../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../../serializable/primitives';
import type { ImportTx } from '../../../serializable/pvm';
import { addTxSignatures } from '../../../signer';
import { AvaxToNAvax } from '../../../utils/avaxToNAvax';
import { newImportTx } from './builder';

/**
 * An AddressMap's storage position is the credential index, and the credential
 * list follows the *sorted* ImportTx.ins. Deriving the maps before sorting
 * therefore routes each signature into another input's credential whenever the
 * supplied order differs from UTXOID order and the inputs have different
 * signers — while hasAllSignatures still reports the tx complete.
 */

/** Low and high UTXOIDs, so the supplied order can be made to differ. */
const lowId = Id.fromHex(
  '0x0000000000000000000000000000000000000000000000000000000000000001',
);
const highId = Id.fromHex(
  '0xff00000000000000000000000000000000000000000000000000000000000000',
);

const utxoOwnedBy = (utxoIdVal: Id, address: Uint8Array): Utxo =>
  new Utxo(
    new UTXOID(utxoIdVal, new Int(0)),
    Id.fromString(testContext.avaxAssetID),
    new TransferOutput(
      new BigIntPr(AvaxToNAvax(5)),
      OutputOwners.fromNative([address]),
    ),
  );

describe('newImportTx signature routing', () => {
  it('places each owner signature in its own input credential', async () => {
    // Supplied in reverse UTXOID order: high (owner 2) first, low (owner 1)
    // second. The in-place sort reverses them inside the tx.
    const utxos = [
      utxoOwnedBy(highId, testAddress2),
      utxoOwnedBy(lowId, testAddress1),
    ];

    const unsignedTx = newImportTx(
      {
        feeState: feeState(),
        fromAddressesBytes: [testAddress1, testAddress2],
        sourceChainId: testContext.xBlockchainID,
        toAddressesBytes: [testAddress1],
        utxos,
      },
      testContext,
    );

    await addTxSignatures({
      unsignedTx,
      privateKeys: [testPrivateKey1, testPrivateKey2],
    });

    expect(unsignedTx.hasAllSignatures()).toBe(true);

    const tx = unsignedTx.getTx() as ImportTx;
    const unsignedHash = sha256(unsignedTx.toBytes());

    // Credential i must be signed by the owner of sorted ins[i].
    const expectedSignerOf = tx.ins.map((input) =>
      input.utxoID.txID.toString() === lowId.toString()
        ? testPublicKey1
        : testPublicKey2,
    );

    // Sanity: the sort really did reorder relative to the supplied order.
    expect(tx.ins[0].utxoID.txID.toString()).toEqual(lowId.toString());

    unsignedTx.getCredentials().forEach((credential, index) => {
      const sigHex = credential.getSignatures()[0];
      const recovered = secp256k1.recoverPublicKey(
        unsignedHash,
        hexToBuffer(sigHex),
      );

      expect(bufferToHex(recovered)).toEqual(
        bufferToHex(expectedSignerOf[index]),
      );
    });
  });
});
