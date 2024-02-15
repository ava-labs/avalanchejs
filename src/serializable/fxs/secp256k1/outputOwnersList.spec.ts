import {
  outputOwnersList,
  outputOwnersListBytes,
} from '../../../fixtures/secp256k1';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { OutputOwnersList } from './outputOwnersList';

testSerialization(
  'OutputOwnersList',
  OutputOwnersList,
  outputOwnersList,
  outputOwnersListBytes,
);
