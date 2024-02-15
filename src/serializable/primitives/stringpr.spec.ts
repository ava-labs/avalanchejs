import { stringPr, stringPrBytes } from '../../fixtures/primitives';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Stringpr } from './stringpr';

testSerialization('Stringpr', Stringpr, stringPr, stringPrBytes);
