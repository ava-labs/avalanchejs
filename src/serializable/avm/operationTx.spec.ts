import { operationTx, operationTxBytes } from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';
import { OperationTx } from './operationTx';

testSerialization('OperationTx', OperationTx, operationTx, operationTxBytes);
