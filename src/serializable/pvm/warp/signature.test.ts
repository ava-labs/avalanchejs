import { testWarpCodec } from '../../../fixtures/codec';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { warpSignature, warpSignatureBytes } from '../../../fixtures/warp';
import { WarpSignature } from './signature';

testSerialization(
  'WarpSignature',
  WarpSignature,
  warpSignature,
  warpSignatureBytes,
  testWarpCodec,
);
