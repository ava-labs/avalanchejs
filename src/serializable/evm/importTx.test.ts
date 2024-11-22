import { testEVMCodec } from '../../fixtures/codec';
import { importTx, importTxBytes } from '../../fixtures/evm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { ImportTx } from './importTx';

testSerialization('ImportTx', ImportTx, importTx, importTxBytes, testEVMCodec);
