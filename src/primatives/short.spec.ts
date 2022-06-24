import { short, shortBytes } from '../fixtures/primatives';
import { testSerialization } from '../fixtures/utils/serializable';
import { Short } from './short';

testSerialization('Short', Short, short, shortBytes);
