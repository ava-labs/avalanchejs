import { signedTx, signedTxBytes } from '../../fixtures/avax';
import { describe, it, expect } from 'vitest';

import { getAVMManager } from '../avm/codec';
import { SignedTx } from './signedTx';

describe('SignedTx', () => {
  it('deserializes correctly', () => {
    const output = getAVMManager().unpack(signedTxBytes(), SignedTx);
    expect(JSON.stringify(output)).toBe(JSON.stringify(signedTx()));
  });
});

describe('SignedTx', () => {
  it('serializes correctly', () => {
    expect(signedTx().toBytes()).toStrictEqual(signedTxBytes());
  });
});
