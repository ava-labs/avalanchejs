import { MintOutput } from '.';
import { mintOutput, mintOutputBytes } from '../../../fixtures/secp256k1';
import { testSerialization } from '../../../fixtures/utils/serializable';

testSerialization('MintOutput', MintOutput, mintOutput, mintOutputBytes);
