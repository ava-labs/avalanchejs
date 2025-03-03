import { testWarpCodec } from '../../../../../fixtures/codec';
import { testSerialization } from '../../../../../fixtures/utils/serializable';
import {
  l1ValidatorWeightMessage,
  l1ValidatorWeightMessageBytes,
} from '../../../../../fixtures/warp';
import { L1ValidatorWeightMessage } from './l1ValidatorWeightMessage';

testSerialization(
  'L1ValidatorWeightMessage',
  L1ValidatorWeightMessage,
  l1ValidatorWeightMessage,
  l1ValidatorWeightMessageBytes,
  testWarpCodec,
);
