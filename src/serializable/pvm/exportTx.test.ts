import { testPVMCodec } from '../../fixtures/codec';
import { exportTx, exportTxBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { ExportTx } from './exportTx';

testSerialization('ExportTx', ExportTx, exportTx, exportTxBytes, testPVMCodec);
