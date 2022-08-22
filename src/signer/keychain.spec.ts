import { transferableOutput } from '../fixtures/avax';
import { testContext } from '../fixtures/context';
import { validator } from '../fixtures/pvm';
import {
  getBaseTxForTest,
  privateKeyForTest,
  testOwnerAddress,
} from '../fixtures/transactions';
import { Credential, OutputOwners } from '../serializable/fxs/secp256k1';
import { Signature } from '../serializable/fxs/secp256k1/signature';
import { Int } from '../serializable/primitives';
import { AddValidatorTx } from '../serializable/pvm';
import { hexToBuffer } from '../utils';
import { AddressMap, AddressMaps } from '../utils/addressMap';
import { UnsignedTx } from '../vms/common/unsignedTx';
import { Secp256K1Keychain } from './keychain';

describe('Secp256K1Keychain', () => {
  it('sign', async () => {
    const addressMaps = new AddressMaps([
      new AddressMap([[testOwnerAddress, 0]]),
    ]);
    const tx = new UnsignedTx(
      new AddValidatorTx(
        getBaseTxForTest(1000n, testContext.xBlockchainID),
        validator(),
        [transferableOutput()],
        OutputOwners.fromNative([testOwnerAddress.toBytes()]),
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
});
