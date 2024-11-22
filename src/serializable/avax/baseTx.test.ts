import { baseTx, baseTxbytes } from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';
import { BaseTx } from './baseTx';

testSerialization('BaseTx', BaseTx, baseTx, baseTxbytes);
