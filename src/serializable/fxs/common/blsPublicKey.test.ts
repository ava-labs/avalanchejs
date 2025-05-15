import { blsPublicKey, blsPublicKeyBytes } from '../../../fixtures/primitives';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { BlsPublicKey } from './blsPublicKey';

testSerialization(
  'BlsPublicKey',
  BlsPublicKey,
  blsPublicKey,
  blsPublicKeyBytes,
);
