import { transferableOutput } from '../fixtures/avax';
import { testContext } from '../fixtures/context';
import { validator } from '../fixtures/pvm';
import {
  getBaseTxForTest,
  getOutputForTest,
  getTransferableInputForTest,
  privateKeyForTest,
  testOwnerCBech32Address,
  testOwnerXAddress,
  testUtxos,
} from '../fixtures/transactions';
import { Credential, OutputOwners } from '../serializable/fxs/secp256k1';
import { Signature } from '../serializable/fxs/secp256k1/signature';
import { Int } from '../serializable/primitives';
import { AddValidatorTx } from '../serializable/pvm';
import { hexToBuffer } from '../utils';
import { AddressMap, AddressMaps } from '../utils/addressMap';
import { UnsignedTx } from '../vms/common/unsignedTx';
import { Secp256K1Keychain } from './keychain';
import { ImportTx } from '../serializable/evm';
import { Id } from '../serializable/fxs/common';

describe('Secp256K1Keychain', () => {
  it('should sign AddValidatorTx', async () => {
    const addressMaps = new AddressMaps([
      new AddressMap([[testOwnerXAddress, 0]]),
    ]);
    const tx = new UnsignedTx(
      new AddValidatorTx(
        getBaseTxForTest(1000n, testContext.xBlockchainID),
        validator(),
        [transferableOutput()],
        OutputOwners.fromNative([testOwnerXAddress.toBytes()]),
        new Int(30),
      ),
      [],
      addressMaps,
    );
    const keyChain = new Secp256K1Keychain();
    keyChain.addPrivateKey(hexToBuffer(privateKeyForTest));

    await keyChain.addSignatures(tx);

    expect(tx.getCredentials()).toEqual([
      new Credential([
        new Signature(
          hexToBuffer(
            '0xa65bd5987979af4013a94872df062f5b8c6dc99aac0985b4a6d894dcf49a98907e103eff1eeca96b102782ab5a7b919af14ed613d2de244e2d58574374f0966001',
          ),
        ),
      ]),
    ]);
  });

  it('should sign newImportTxFromBaseFee', async () => {
    const pk = hexToBuffer(privateKeyForTest);

    const newImportTx = new UnsignedTx(
      new ImportTx(
        new Int(testContext.networkID),
        Id.fromString(testContext.cBlockchainID),
        Id.fromString(testContext.xBlockchainID),
        [getTransferableInputForTest()],
        [getOutputForTest()],
      ),
      testUtxos(),
      new AddressMaps([new AddressMap([[testOwnerCBech32Address, 0]])]),
    );

    const keyChain = new Secp256K1Keychain([pk]);

    await keyChain.addSignatures(newImportTx);

    expect(newImportTx.getCredentials()).toEqual([
      new Credential([
        new Signature(
          hexToBuffer(
            'db728581b8929c5a53082a7efe8040392c4457f0c70f5a1397f1be5ad41467950ca920fe5e4c19743e975c992f2d377e5a3237c55ca9b7ee9327ff1967bc362601',
          ),
        ),
      ]),
    ]);
  });
});
