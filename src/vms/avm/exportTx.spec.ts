import { exportTx, exportTxBytes } from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';
import { ExportTx } from './exportTx';

testSerialization('ExportTx', ExportTx, exportTx, exportTxBytes);
