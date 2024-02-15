import { testEVMCodec } from '../../fixtures/codec';
import { exportTx, exportTxBytes } from '../../fixtures/evm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { ExportTx } from './exportTx';

testSerialization('ExportTx', ExportTx, exportTx, exportTxBytes, testEVMCodec);
