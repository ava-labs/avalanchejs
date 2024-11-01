import { testPVMCodec } from '../../../fixtures/codec';
import { nodeId, nodeIdBytes } from '../../../fixtures/common';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { NodeId } from './nodeId';

testSerialization('NodeId', NodeId, nodeId, nodeIdBytes, testPVMCodec);
