import { signedTx, signedTxBytes } from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';
import { SignedTx } from './signedTx';

testSerialization('SignedTx', SignedTx, signedTx, signedTxBytes);
