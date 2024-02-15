import { testEVMCodec } from '../../fixtures/codec';
import { input, inputBytes } from '../../fixtures/secp256k1';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Input } from '../fxs/secp256k1';

testSerialization('Input', Input, input, inputBytes, testEVMCodec);
