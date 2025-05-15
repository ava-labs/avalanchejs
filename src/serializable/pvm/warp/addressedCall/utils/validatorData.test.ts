import { testWarpCodec } from '../../../../../fixtures/codec';
import { testSerialization } from '../../../../../fixtures/utils/serializable';
import {
  validatorData,
  validatorDataBytes,
} from '../../../../../fixtures/warp';
import { ValidatorData } from './validatorData';

testSerialization(
  'ValidatorData',
  ValidatorData,
  validatorData,
  validatorDataBytes,
  testWarpCodec,
);
