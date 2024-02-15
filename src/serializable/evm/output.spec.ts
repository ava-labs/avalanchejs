import { testEVMCodec } from '../../fixtures/codec';
import { output, outputBytes } from '../../fixtures/evm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Output } from './output';

testSerialization('Output', Output, output, outputBytes, testEVMCodec);
