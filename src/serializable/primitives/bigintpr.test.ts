import { bigIntPr, bigIntPrBytes } from '../../fixtures/primitives';
import { testSerialization } from '../../fixtures/utils/serializable';
import { BigIntPr } from './bigintpr';

testSerialization('Bigintpr', BigIntPr, bigIntPr, bigIntPrBytes);
