import { testWarpMessageCodec } from '../../../../fixtures/codec';
import { testSerialization } from '../../../../fixtures/utils/serializable';
import { addressedCall, addressedCallBytes } from '../../../../fixtures/warp';
import { AddressedCall } from './addressedCall';

testSerialization(
  'AddressedCall',
  AddressedCall,
  addressedCall,
  addressedCallBytes,
  testWarpMessageCodec,
);
