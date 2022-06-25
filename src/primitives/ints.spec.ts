import { ints, intsBytes } from '../fixtures/primitives';
import { testSerialization } from '../fixtures/utils/serializable';
import { Ints } from '.';

testSerialization('Ints', Ints, ints, intsBytes);
