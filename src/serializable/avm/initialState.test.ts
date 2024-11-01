import { initialState, initialStateBytes } from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';
import { InitialState } from './initialState';

testSerialization(
  'InitialState',
  InitialState,
  initialState,
  initialStateBytes,
);
