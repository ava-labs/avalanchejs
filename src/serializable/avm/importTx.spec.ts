import { importTx, importTxBytes } from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';
import { ImportTx } from './importTx';

testSerialization('ImportTx', ImportTx, importTx, importTxBytes);
