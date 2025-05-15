import { testWarpCodec } from '../../../../../fixtures/codec';
import { testSerialization } from '../../../../../fixtures/utils/serializable';
import {
  registerL1ValidatorMessage,
  registerL1ValidatorMessageBytes,
} from '../../../../../fixtures/warp';
import { RegisterL1ValidatorMessage } from './registerL1ValidatorMessage';

testSerialization(
  'RegisterL1ValidatorMessage',
  RegisterL1ValidatorMessage,
  registerL1ValidatorMessage,
  registerL1ValidatorMessageBytes,
  testWarpCodec,
);
