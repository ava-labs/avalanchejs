import { int, intBytes } from '../fixtures/primatives';
import { testSerialization } from '../fixtures/utils/serializable';
import { Int } from './int';

testSerialization('Int', Int, int, intBytes);
