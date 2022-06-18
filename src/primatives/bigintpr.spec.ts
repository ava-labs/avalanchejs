import { bigIntPr, bigIntPrBytes } from '../fixtures/primatives';
import { testSerialization } from '../fixtures/utils/serializable';
import { BigIntPr } from './bigintpr';

testSerialization('Bigintpr', BigIntPr, bigIntPr, bigIntPrBytes);
