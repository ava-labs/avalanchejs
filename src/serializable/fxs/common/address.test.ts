import { address, addressBytes } from '../../../fixtures/common';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { Address } from './address';

testSerialization('Address', Address, address, addressBytes);
