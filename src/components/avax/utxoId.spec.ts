import { utxoId, utxoIdBytes } from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';
import { UTXOID } from '.';

testSerialization('UTXOID', UTXOID, utxoId, utxoIdBytes);
