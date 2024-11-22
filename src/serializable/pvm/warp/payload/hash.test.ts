import { testWarpPayloadCodec } from '../../../../fixtures/codec';
import { testSerialization } from '../../../../fixtures/utils/serializable';
import { hash, hashBytes } from '../../../../fixtures/warp';
import { Hash } from './hash';

testSerialization('WarpHash', Hash, hash, hashBytes, testWarpPayloadCodec);
