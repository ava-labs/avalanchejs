import { Input } from '.';
import { input, inputBytes } from '../../../fixtures/secp256k1';
import { testSerialization } from '../../../fixtures/utils/serializable';

testSerialization('Input', Input, input, inputBytes);
