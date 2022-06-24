import { utxo, utxoBytes } from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Utxo } from './utxo';

testSerialization('Utxo', Utxo, utxo, utxoBytes);
