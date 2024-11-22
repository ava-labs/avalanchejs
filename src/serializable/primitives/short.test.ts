import { short, shortBytes } from '../../fixtures/primitives';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Short } from './short';

testSerialization('Short', Short, short, shortBytes);
