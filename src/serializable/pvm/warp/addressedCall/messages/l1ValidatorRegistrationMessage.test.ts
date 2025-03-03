import { testWarpCodec } from '../../../../../fixtures/codec';
import { testSerialization } from '../../../../../fixtures/utils/serializable';
import {
  l1ValidatorRegistrationMessage,
  l1ValidatorRegistrationMessageBytes,
} from '../../../../../fixtures/warp';
import { L1ValidatorRegistrationMessage } from './l1ValidatorRegistrationMessage';

testSerialization(
  'L1ValidatorRegistrationMessage',
  L1ValidatorRegistrationMessage,
  l1ValidatorRegistrationMessage,
  l1ValidatorRegistrationMessageBytes,
  testWarpCodec,
);
