import { addresses, addressesBytes } from '../../fixtures/common';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Addresses } from './addresses';

testSerialization('Addresses', Addresses, addresses, addressesBytes);
