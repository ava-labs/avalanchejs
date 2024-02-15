import { pvmBaseTx, pvmBaseTxBytes } from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';
import { BaseTx } from './baseTx';

testSerialization('BaseTx', BaseTx, pvmBaseTx, pvmBaseTxBytes);
