import { testWarpCodec } from '../../../fixtures/codec';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { warpMessage, warpMessageBytes } from '../../../fixtures/warp';
import { WarpMessage } from './message';

testSerialization(
  'WarpMessage',
  WarpMessage,
  warpMessage,
  warpMessageBytes,
  testWarpCodec,
);
