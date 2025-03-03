import { testWarpCodec } from '../../../../../fixtures/codec';
import { testSerialization } from '../../../../../fixtures/utils/serializable';
import {
  conversionData,
  conversionDataBytes,
} from '../../../../../fixtures/warp';
import { ConversionData } from './conversionData';

testSerialization(
  'ConversionData',
  ConversionData,
  conversionData,
  conversionDataBytes,
  testWarpCodec,
);
