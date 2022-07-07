import { bytes, bytesBytes } from '../../fixtures/primitives';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Bytes } from './bytes';

testSerialization('Bytes', Bytes, bytes, bytesBytes);
