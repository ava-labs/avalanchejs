import { UTXOID } from '.';
import { utxoId, utxoIdBytes } from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';

testSerialization('UTXOID', UTXOID, utxoId, utxoIdBytes);
