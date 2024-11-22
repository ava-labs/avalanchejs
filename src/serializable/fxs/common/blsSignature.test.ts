import { blsSignature, blsSignatureBytes } from '../../../fixtures/primitives';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { BlsSignature } from './blsSignature';

testSerialization(
  'BlsSignature',
  BlsSignature,
  blsSignature,
  blsSignatureBytes,
);
