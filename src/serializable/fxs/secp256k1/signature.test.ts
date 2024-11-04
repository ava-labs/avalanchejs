import { signature, signatureBytes } from '../../../fixtures/secp256k1';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { Signature } from './signature';

testSerialization('Signature', Signature, signature, signatureBytes);
