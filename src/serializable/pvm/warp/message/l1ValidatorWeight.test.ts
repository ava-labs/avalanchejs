import { testWarpMessageCodec } from '../../../../fixtures/codec';
import { testSerialization } from '../../../../fixtures/utils/serializable';
import {
  l1ValidatorWeight,
  l1ValidatorWeightBytes,
} from '../../../../fixtures/warp';
import { L1ValidatorWeight } from './l1ValidatorWeight';

testSerialization(
  'WarpL1ValidatorWeight',
  L1ValidatorWeight,
  l1ValidatorWeight,
  l1ValidatorWeightBytes,
  testWarpMessageCodec,
);
