import { credential, credentialBytes } from '../../../fixtures/secp256k1';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { Credential } from './credential';

testSerialization('Credential', Credential, credential, credentialBytes);
