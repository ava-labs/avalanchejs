import { testWarpCodec } from '../../../../fixtures/codec';
import { testSerialization } from '../../../../fixtures/utils/serializable';
import { addressedCall, addressedCallBytes } from '../../../../fixtures/warp';
import { AddressedCall } from './addressedCallPayload';

testSerialization(
  'AddressedCall',
  AddressedCall,
  addressedCall,
  addressedCallBytes,
  testWarpCodec,
);
