import { int, intBytes } from '../../fixtures/primitives';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Int } from './int';

testSerialization('Int', Int, int, intBytes);
