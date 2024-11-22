import { testWarpCodec } from '../../../fixtures/codec';
import { testSerialization } from '../../../fixtures/utils/serializable';
import {
  warpUnsignedMessage,
  warpUnsignedMessageBytes,
} from '../../../fixtures/warp';
import { WarpUnsignedMessage } from './unsignedMessage';

testSerialization(
  'WarpUnsignedMessage',
  WarpUnsignedMessage,
  warpUnsignedMessage,
  warpUnsignedMessageBytes,
  testWarpCodec,
);
