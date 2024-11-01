import { MintOutput } from '.';
import { mintOutput, mintOutputBytes } from '../../../fixtures/nft';
import { testSerialization } from '../../../fixtures/utils/serializable';

testSerialization('MintOutput', MintOutput, mintOutput, mintOutputBytes);
