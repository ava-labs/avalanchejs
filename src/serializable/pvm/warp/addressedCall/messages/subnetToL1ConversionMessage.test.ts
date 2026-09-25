import { testWarpCodec } from '../../../../../fixtures/codec';
import { testSerialization } from '../../../../../fixtures/utils/serializable';
import {
  subnetToL1ConversionMessage,
  subnetToL1ConversionMessageBytes,
} from '../../../../../fixtures/warp';
import { SubnetToL1ConversionMessage } from './subnetToL1ConversionMessage';

testSerialization(
  'SubnetToL1ConversionMessage',
  SubnetToL1ConversionMessage,
  subnetToL1ConversionMessage,
  subnetToL1ConversionMessageBytes,
  testWarpCodec,
);
