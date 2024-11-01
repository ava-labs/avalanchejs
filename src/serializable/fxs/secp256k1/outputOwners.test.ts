import { OutputOwners } from '.';
import { outputOwner, outputOwnerBytes } from '../../../fixtures/secp256k1';
import { testSerialization } from '../../../fixtures/utils/serializable';

testSerialization('OutputOwners', OutputOwners, outputOwner, outputOwnerBytes);
