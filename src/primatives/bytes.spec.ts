import { bytes, bytesBytes } from '../fixtures/primatives';
import { testSerialization } from '../fixtures/utils/serializable';
import { Bytes } from './bytes';

testSerialization('Bytes', Bytes, bytes, bytesBytes);
