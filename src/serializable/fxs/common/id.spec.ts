import { id, idBytes } from '../../../fixtures/common';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { Id } from './id';

testSerialization('Id', Id, id, idBytes);
