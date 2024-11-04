import { testPVMCodec } from '../../fixtures/codec';
import { importTx, importTxBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { ImportTx } from './importTx';

testSerialization('ImportTx', ImportTx, importTx, importTxBytes, testPVMCodec);
