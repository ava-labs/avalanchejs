import { avmBaseTx, avmBaseTxBytes } from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';
import { BaseTx } from './baseTx';

testSerialization('BaseTx', BaseTx, avmBaseTx, avmBaseTxBytes);
